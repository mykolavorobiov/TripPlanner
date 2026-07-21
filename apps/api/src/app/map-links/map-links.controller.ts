import { Body, Controller, Post } from '@nestjs/common';
import { MapLinksService } from './map-links.service';

@Controller('map-links')
export class MapLinksController {
  constructor(private readonly mapLinks: MapLinksService) {}

  @Post('resolve')
  resolve(@Body() body: { url?: string }) {
    return this.mapLinks.resolve(body.url ?? '');
  }
}
