export type ApiUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

export type ApiSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: ApiUser;
};

export type RegistrationResult = {
  requiresEmailConfirmation: boolean;
};
