import type { RouteInfo, RouteOptions, Waypoint } from '../route';

export type RouteRow = {
  id: string;
  name: string;
  color: string;
  waypoints: Waypoint[];
  options: RouteOptions;
  info: RouteInfo | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};
