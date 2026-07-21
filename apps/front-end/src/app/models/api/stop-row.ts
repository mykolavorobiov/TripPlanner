export type StopRow = {
  id: string;
  where: string;
  datetime: string;
  comment: string;
  goal: string;
  map_link: string;
  lat: number | null;
  lng: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  stop_tags?: { tag_id: string }[];
};
