import type { AuthSession, LoginCredentials } from '../entities/Auth';
import type { User } from '../entities/User';

/**
 * Port (interface) owned by the Domain layer. The Data layer provides the
 * concrete adapter (`AuthRepositoryImpl`) that talks to axios/Keychain.
 * Use cases and hooks depend on this interface only — this is the
 * Dependency Inversion piece of Clean Architecture: domain defines the
 * contract, data satisfies it, and the dependency arrow still points
 * inward (data → domain), never the reverse.
 */
export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<User>;
}
