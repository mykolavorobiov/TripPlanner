import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Map points')
@ApiBearerAuth('access-token')
@Controller('map-points')
@UseGuards(SupabaseAuthGuard)
export class MapPointsController extends FeatureController {
  constructor(data: DataService) {
    super('map-points', data);
  }
}
