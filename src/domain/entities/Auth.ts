export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokenPair {
  accessToken: string;
  orgToken: string;
}

import type { User } from './User';

export interface AuthSession {
  user: User;
  accessToken: string;
  orgToken: string;
}
