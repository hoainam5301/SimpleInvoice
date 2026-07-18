import type { AuthRepository } from '../../repositories/AuthRepository';
import type { AuthSession } from '../../entities/Auth';

/**
 * Runs once at cold start (see useAuth) to silently re-authenticate a
 * returning user from tokens already sitting in the Keychain, so they
 * aren't forced to log in on every app launch. Returns null (not a thrown
 * error) when there is no valid session — "no session" is an expected
 * outcome here, not a failure.
 */
export class RestoreSessionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<AuthSession | null> {
    return this.authRepository.restoreSession();
  }
}
