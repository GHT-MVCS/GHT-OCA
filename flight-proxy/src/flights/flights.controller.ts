import { Controller, Get, Query } from '@nestjs/common';
import { FlightsService } from './flights.service';

@Controller('api/flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  // GET /api/flights/live?ids=N319CM,N334QT,XAARU,N307UP
  @Get('live')
  async getLive(@Query('ids') ids: string) {
    const lista = (ids || '')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length >= 4)
      .slice(0, 20); // máximo 20

    if (!lista.length) return { vuelos: [], error: 'Sin IDs' };

    const vuelos = await this.flightsService.getLiveMultiple(lista);
    return { vuelos, total: vuelos.length };
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
    return { ok: true, ts: new Date().toISOString() };
  }
}