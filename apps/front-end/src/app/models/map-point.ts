export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
};

export type RequestMapPoint = {
  label: string;
  lat: number;
  lng: number;
  color: string;
};
