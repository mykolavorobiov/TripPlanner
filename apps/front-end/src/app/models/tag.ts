export type Tag = {
  id: string;
  name: string;
  color?: string;

  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RequestTag = {
  name: string;
  color?: string;
};
