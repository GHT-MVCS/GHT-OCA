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

  // Llamada a FlightAware con reintento automático si una key falla por límite
  private async callFlightAware(url: string, keyIndex: number = 0): Promise<any> {
    if (keyIndex >= this.apiKeys.length) {
      throw new Error('Todas las API keys de FlightAware fallaron');
    }

    const apiKey = this.apiKeys[keyIndex];
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
      if (status === 429 || status === 403) {
        console.warn(`⚠️ API key ${keyIndex + 1} falló (${status}). Cambiando a la siguiente.`);
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
      if (!vuelos.length) return null;

      const activo = vuelos.find((f) => f.last_position) || vuelos[0];
      const pos = activo.last_position;

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
      console.error(`❌ FlightAware [${ident}] → ${err.message}`);
      return null;
    }
  }

  // ── Buscar múltiples en paralelo (respetando límite de la API free) ──
  async getLiveMultiple(ids: string[]) {
    const CHUNK = 5; // FlightAware recomienda no más de 5 en paralelo en plan gratis
    const resultados: any[] = [];

    for (let i = 0; i < ids.length; i += CHUNK) {
      const grupo = ids.slice(i, i + CHUNK);
      const lote = await Promise.all(grupo.map((id) => this.getVueloActivo(id)));
      resultados.push(...lote.filter(Boolean));
      if (i + CHUNK < ids.length) {
        await new Promise((r) => setTimeout(r, 500)); // pausa entre lotes
      }
    }
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