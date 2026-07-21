import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@Controller('trips')
@UseGuards(SupabaseAuthGuard)
export class TripsController extends FeatureController {
  constructor(data: DataService) {
    super('trips', data);
  }
}
