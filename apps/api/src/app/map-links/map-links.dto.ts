import { ApiProperty } from '@nestjs/swagger';

export class ResolveMapLinkDto {
  @ApiProperty({ example: 'https://maps.app.goo.gl/example' })
  url!: string;
}
