import { Module } from '@nestjs/common';
import { GeocodingService } from './services/geocoding.service';

@Module({
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class CommonModule {}
