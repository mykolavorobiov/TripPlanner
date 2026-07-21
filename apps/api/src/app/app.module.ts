import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MapLinksModule } from './map-links/map-links.module';
import { AuthModule } from './auth/auth.module';
import { DataModule } from './data/data.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    SupabaseModule,
    MapLinksModule,
    AuthModule,
    DataModule,
  ],
})
export class AppModule {}
