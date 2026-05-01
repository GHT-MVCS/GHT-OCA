import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FlightsService } from './flights.service';

let cachedFlights: { vuelos: any[]; savedAt: string | null } = {
  vuelos: [],
  savedAt: null
};

@Controller('api/flights')
export class FlightsController {
  constructor(private readonly flightsService: FlightsService) {}

  @Get('live')
  async getLive(@Query('ids') ids: string) {
    // ... tu código existente sin cambios ...
  }

  @Get('one')
  async getOne(@Query('id') id: string) {
    // ... sin cambios ...
  }

  @Get('region')
  async getRegion() {
    return this.flightsService.getRegionBog();
  }

  @Get('ping')
  ping() {
    const config = this.flightsService.getHealthCheck();
    return { ok: true, ts: new Date().toISOString(), ...config };
  }

  @Get('debug')
  async getDebug(@Query('id') id: string) {
    // ... sin cambios ...
  }

  // ← NUEVO
  @Get('cache')
  getCache() {
    return cachedFlights;
  }

  // ← NUEVO
  @Post('cache')
  setCache(@Body() body: { vuelos: any[] }) {
    if (!Array.isArray(body?.vuelos)) {
      return { error: 'vuelos debe ser array' };
    }
    cachedFlights = { vuelos: body.vuelos, savedAt: new Date().toISOString() };
    console.log(`💾 Cache actualizado: ${body.vuelos.length} vuelos`);
    return { ok: true, total: body.vuelos.length, savedAt: cachedFlights.savedAt };
  }
}