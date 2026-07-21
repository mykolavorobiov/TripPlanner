import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Stops')
@ApiBearerAuth('access-token')
@Controller('stops')
@UseGuards(SupabaseAuthGuard)
export class StopsController extends FeatureController {
  constructor(data: DataService) {
    super('stops', data);
  }
}
