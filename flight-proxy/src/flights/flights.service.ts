import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FlightsService {
  private readonly apiKeys: string[];
  private currentKeyIndex = 0;
  private readonly BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Obtener las dos keys desde las variables de entorno
    this.apiKeys = [
      this.configService.get<string>('FLIGHT_AWARE_KEY_1'),
      this.configService.get<string>('FLIGHT_AWARE_KEY_2'),
    ].filter((key) => key && key.length > 0);

    if (this.apiKeys.length === 0) {
      console.warn('⚠️ No se encontraron API keys de FlightAware en .env');
    } else {
      console.log(`✅ Cargadas ${this.apiKeys.length} API keys de FlightAware`);
    }
  }

  // Obtener la siguiente key (round‑robin)
  private getNextKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  // Health check para diagnosticar problemas
  getHealthCheck() {
    return {
      apiKeysLoaded: this.apiKeys.length,
      apiKeysStatus: this.apiKeys.map((k, i) => ({
        index: i + 1,
        loaded: !!k,
        status: k && k.length > 10 ? '✅ válida' : '❌ falta configurar'
      })),
      mensaje: this.apiKeys.length === 0 
        ? '🔴 CRÍTICO: No hay API keys. Configura FLIGHT_AWARE_KEY_1 y FLIGHT_AWARE_KEY_2 en .env'
        : this.apiKeys.length === 1
        ? '⚠️ Una API key disponible'
        : '✅ Dos API keys disponibles'
    };
  }

  // Llamada a FlightAware con reintento automático si una key falla por límite
  private async callFlightAware(url: string, keyIndex: number = 0): Promise<any> {
    if (keyIndex >= this.apiKeys.length) {
      const err = new Error('🔴 TODAS LAS API KEYS FALLARON: Sin claves válidas o límites excedidos');
      console.error(err.message);
      throw err;
    }

    const apiKey = this.apiKeys[keyIndex];
    if (!apiKey) {
      console.error(`⚠️ API Key ${keyIndex + 1}/2 está vacía - verifica .env`);
      return this.callFlightAware(url, keyIndex + 1);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { 'x-apikey': apiKey },
          timeout: 10000,
        }),
      );
      // Si la respuesta indica que se excedió la cuota (puedes ajustar el código)
      if (response.status === 429 || response.data?.error?.code === 'rate_limit') {
        console.warn(`⚠️ API key ${keyIndex + 1} excedió límite. Cambiando a la siguiente.`);
        return this.callFlightAware(url, keyIndex + 1);
      }
      return response.data;
    } catch (err: any) {
      const status = err.response?.status;
      const msgError = err.response?.data?.error?.message || err.message || 'Unknown error';
      console.error(`❌ API key ${keyIndex + 1} falló [${status}]: ${msgError}`);
      
      if (status === 429 || status === 403) {
        console.warn(`   → Intentando siguiente clave...`);
        return this.callFlightAware(url, keyIndex + 1);
      }
      throw err;
    }
  }

  // ── Buscar vuelo activo por matrícula o callsign (usando rotación de keys) ──
  async getVueloActivo(ident: string) {
    try {
      const url = `${this.BASE_URL}/flights/${encodeURIComponent(ident)}`;
      const data = await this.callFlightAware(url);

      const vuelos: any[] = data.flights || [];
      if (!vuelos.length) {
        console.warn(`⚠️ No hay vuelos encontrados para ${ident}`);
        return null;
      }

      const activo = vuelos.find((f) => f.last_position) || vuelos[0];
      if (!activo) {
        console.warn(`⚠️ FlightAware: ${ident} sin posición`, { vuelos });
        return null;
      }

      const pos = activo.last_position;
      if (!pos) {
        console.warn(`⚠️ ${ident} sin last_position. Estado: ${activo.status}`);
        return null;
      }

      return {
        ident,
        callsign: activo.ident_icao || activo.ident || ident,
        reg: activo.registration || ident,
        origen: activo.origin?.code_iata || activo.origin?.code_icao || '',
        destino: activo.destination?.code_iata || activo.destination?.code_icao || '',
        estado: activo.status || '',
        lat: pos?.latitude ?? null,
        lon: pos?.longitude ?? null,
        alt: pos?.altitude ?? 0,
        vel: pos?.groundspeed ?? 0,
        heading: pos?.heading ?? 0,
        tierra: pos ? (pos.altitude ?? 0) < 200 : true,
        timestamp: pos?.timestamp || null,
      };
    } catch (err: any) {
      console.error(`❌ FlightAware [${ident}] → ${err.message}`, err.response?.status, err.response?.data);
      return null;
    }
  }

  // ── Buscar múltiples en paralelo (respetando límite de la API free) ──
  async getLiveMultiple(ids: string[]) {
    if (!ids || ids.length === 0) {
      console.warn('⚠️ getLiveMultiple: Lista de IDs vacía');
      return [];
    }

    console.log(`🔍 Buscando ${Math.min(ids.length, 5)} vuelos...`);
    const resultados = [];
    const errores: string[] = [];

    for (const id of ids.slice(0, 5)) {
      try {
        const vuelo = await this.getVueloActivo(id);
        if (vuelo) {
          resultados.push(vuelo);
          console.log(`✅ ${id} encontrado`);
        } else {
          console.warn(`⚠️ ${id} no tiene datos activos`);
          errores.push(`${id}: sin datos`);
        }
      } catch (e: any) {
        console.error(`❌ Error con ${id}: ${e.message}`);
        errores.push(`${id}: ${e.message}`);
      }
    }

    if (errores.length > 0) {
      console.warn(`⚠️ Errores durante búsqueda:`, errores);
    }

    console.log(`📊 Resultados: ${resultados.length} vuelos encontrados de ${Math.min(ids.length, 5)} solicitados`);
    return resultados;
  }

  // ── Vuelos cercanos a BOG (fallback si no hay matrículas activas) ──
  async getRegionBog() {
    try {
      const url = `${this.BASE_URL}/flights/search/advanced`;
      const data = await this.callFlightAware(url);
      const vuelos: any[] = data.flights || [];
      return vuelos
        .filter((f) => f.last_position)
        .map((f) => ({
          ident: f.ident,
          callsign: f.ident_icao || f.ident,
          reg: f.registration || '',
          lat: f.last_position.latitude,
          lon: f.last_position.longitude,
          alt: f.last_position.altitude || 0,
          vel: f.last_position.groundspeed || 0,
          heading: f.last_position.heading || 0,
          tierra: (f.last_position.altitude || 0) < 200,
          origen: f.origin?.code_iata || '',
          destino: f.destination?.code_iata || '',
        }));
    } catch (err: any) {
      console.error('❌ getRegionBog:', err.response?.status, err.message);
      return [];
    }
  }
}