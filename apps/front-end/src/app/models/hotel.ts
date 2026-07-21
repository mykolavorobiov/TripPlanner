export type RequestHotel = {
  name: string;
  where: string;
  imageSrc: string;
  link?: string;
  checkIn: string;
  checkOut: string;
  comment?: string;
  mapLink?: string;
  tagId?: string;
  stopId?: string;
};

export type Hotel = RequestHotel & { id: string };
