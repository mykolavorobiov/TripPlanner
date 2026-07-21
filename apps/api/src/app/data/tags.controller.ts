import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';
import { FeatureController } from './feature.controller';

@ApiTags('Tags')
@ApiBearerAuth('access-token')
@Controller('tags')
@UseGuards(SupabaseAuthGuard)
export class TagsController extends FeatureController {
  constructor(data: DataService) {
    super('tags', data);
  }
}
