export type Waypoint = {
  lat: number;
  lng: number;
  label: string;
};

export type RouteInfo = {
  distance: number;
  duration: number;
};

export type RouteOptions = {
  avoidTolls: boolean;
};

export type Route = {
  id: string;
  name: string;
  color: string;
  waypoints: Waypoint[];
  options: RouteOptions;
  info: RouteInfo | null;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type RequestRoute = {
  name: string;
  color: string;
  waypoints: Waypoint[];
  options: RouteOptions;
  info: RouteInfo | null;
};
