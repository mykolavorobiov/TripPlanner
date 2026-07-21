import { Body, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import type { EntityName } from './data.models';
import { DataService } from './data.service';

export abstract class FeatureController {
  protected constructor(
    private readonly entity: EntityName,
    private readonly data: DataService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List records' })
  list() {
    return this.data.list(this.entity);
  }

  @Post()
  @ApiOperation({ summary: 'Create a record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  create(
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.data.create(this.entity, body, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.data.update(this.entity, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a record' })
  remove(@Param('id') id: string) {
    return this.data.remove(this.entity, id);
  }
}
