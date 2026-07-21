export type EntityName =
  | 'tags'
  | 'stops'
  | 'hotels'
  | 'map-points'
  | 'routes'
  | 'trips';

export type EntityConfiguration = {
  table: string;
  order: string;
  ascending: boolean;
};

export const entityConfigurations: Record<EntityName, EntityConfiguration> = {
  tags: { table: 'tags', order: 'name', ascending: true },
  stops: { table: 'stops', order: 'datetime', ascending: true },
  hotels: { table: 'hotels', order: 'check_in', ascending: true },
  'map-points': { table: 'map_points', order: 'created_at', ascending: false },
  routes: { table: 'routes', order: 'created_at', ascending: true },
  trips: { table: 'trip', order: 'id', ascending: true },
};
