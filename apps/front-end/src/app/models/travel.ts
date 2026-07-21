import type { Stop } from './stop';

export type CheckIn = {
  where: string;
  place: string;
  options: [];
  comment: string;
  mapLink: string;
};

export type PointOfInterest = {
  id: string;
  where: string;
  what: string;
  price: string;
  datetime: string;
  duration: string;
  mapLink: string;
};

export type TravelEvent = {
  stops: Stop[];
  checkin: CheckIn[];
  pointOfInterests: PointOfInterest[];
};

export type TravelEventCreation = 'stop' | 'checkin' | 'pointOfInteres';
