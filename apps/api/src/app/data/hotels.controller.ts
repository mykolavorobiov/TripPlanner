import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Hotels')
@ApiBearerAuth('access-token')
@Controller('hotels')
@UseGuards(SupabaseAuthGuard)
export class HotelsController extends FeatureController {
  constructor(data: DataService) {
    super('hotels', data);
  }
}
