import { Module } from '@nestjs/common';
import { MapLinksController } from './map-links.controller';
import { MapLinksService } from './map-links.service';

@Module({
  controllers: [MapLinksController],
  providers: [MapLinksService],
})
export class MapLinksModule {}
