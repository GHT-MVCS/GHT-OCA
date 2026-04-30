import { Controller, Get, Query } from '@nestjs/common';
import { FlightsService } from './flights.service';

@Controller('api/flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  // GET /api/flights/live?ids=N319CM,N334QT,XAARU,N307UP
  @Get('live')
  async getLive(@Query('ids') ids: string) {
    console.log(`📥 /api/flights/live?ids=${ids}`);
    
    const lista = (ids || '')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length >= 4)
      .slice(0, 20); // máximo 20

    if (!lista.length) {
      return { 
        vuelos: [], 
        error: 'Sin IDs válidas',
        mensaje: '⚠️ No se encontraron IDs válidas (mínimo 4 caracteres)'
      };
    }

    try {
      const vuelos = await this.flightsService.getLiveMultiple(lista);
      return { 
        vuelos, 
        total: vuelos.length,
        idsProcessadas: lista.length,
        mensaje: `✅ ${vuelos.length}/${lista.length} vuelos encontrados`
      };
    } catch (error: any) {
      console.error('❌ Error en /api/flights/live:', error.message);
      return { 
        vuelos: [],
        error: error.message,
        mensaje: '❌ Error al obtener posiciones de FlightAware'
      };
    }
  }

  // GET /api/flights/one?id=N319CM
  @Get('one')
  async getOne(@Query('id') id: string) {
    if (!id) return { error: 'Falta id' };
    return this.flightsService.getVueloActivo(id.trim().toUpperCase());
  }

  // GET /api/flights/region  (fallback sin matrículas)
  @Get('region')
  async getRegion() {
    return this.flightsService.getRegionBog();
  }

  // GET /api/flights/ping  (health check)
  @Get('ping')
  ping() {
    const config = this.flightsService.getHealthCheck();
    return { 
      ok: true, 
      ts: new Date().toISOString(),
      ...config
    };
  }
  @Get('debug')
  async getDebug(@Query('id') id: string) {
    if (!id) return { error: 'Falta ?id=MATRICULA' };
    const url = `${this.flightsService['BASE_URL']}/flights/${encodeURIComponent(id.trim().toUpperCase())}`;
    const data = await this.flightsService['callFlightAware'](url);
    return data;
  }
}