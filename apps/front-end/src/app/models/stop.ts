export type RequestStop = {
  where: string;
  datetime: string;
  comment: string;
  goal: string;
  mapLink: string;
};

export type Stop = RequestStop & {
  id: string;
  tagIds?: string[];
  lat?: number | null;
  lng?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
