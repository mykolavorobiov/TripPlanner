import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { DataService } from './data.service';
import { HotelsController } from './hotels.controller';
import { MapPointsController } from './map-points.controller';
import { RoutesController } from './routes.controller';
import { StopsController } from './stops.controller';
import { TagsController } from './tags.controller';
import { TripsController } from './trips.controller';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [
    HotelsController,
    StopsController,
    TagsController,
    MapPointsController,
    RoutesController,
    TripsController,
  ],
  providers: [DataService],
})
export class DataModule {}
