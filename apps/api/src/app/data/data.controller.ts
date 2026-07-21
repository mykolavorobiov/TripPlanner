import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataService } from './data.service';

@Controller('data')
@UseGuards(SupabaseAuthGuard)
export class DataController {
  constructor(private readonly data: DataService) {}

  @Get(':entity')
  list(@Param('entity') entity: string) {
    return this.data.list(entity);
  }

  @Post(':entity')
  create(
    @Param('entity') entity: string,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.data.create(entity, body, request.user.id);
  }

  @Patch(':entity/:id')
  update(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.data.update(entity, id, body);
  }

  @Delete(':entity/:id')
  remove(@Param('entity') entity: string, @Param('id') id: string) {
    return this.data.remove(entity, id);
  }
}
