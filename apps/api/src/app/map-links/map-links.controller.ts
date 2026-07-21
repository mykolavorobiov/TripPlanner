import { Body, Controller, Post } from '@nestjs/common';
import { MapLinksService } from './map-links.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResolveMapLinkDto } from './map-links.dto';

@ApiTags('Map links')
@Controller('map-links')
export class MapLinksController {
  constructor(private readonly mapLinks: MapLinksService) {}

  @Post('resolve')
  @ApiOperation({
    summary: 'Resolve a Google Maps short link and extract coordinates',
  })
  resolve(@Body() body: ResolveMapLinkDto) {
    return this.mapLinks.resolve(body.url);
  }
}
