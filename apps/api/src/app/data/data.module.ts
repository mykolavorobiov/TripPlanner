import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { DataController } from './data.controller';
import { DataService } from './data.service';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
