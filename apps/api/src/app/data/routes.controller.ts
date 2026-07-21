import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Routes')
@ApiBearerAuth('access-token')
@Controller('routes')
@UseGuards(SupabaseAuthGuard)
export class RoutesController extends FeatureController {
  constructor(data: DataService) {
    super('routes', data);
  }
}
