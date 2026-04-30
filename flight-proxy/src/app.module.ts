import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FlightsModule } from './flights/flights.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FlightsModule,
  ],
})
export class AppModule {}