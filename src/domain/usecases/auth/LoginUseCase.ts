import type { AuthRepository } from '../../repositories/AuthRepository';
import type { AuthSession, LoginCredentials } from '../../entities/Auth';
import { isNonEmptyString } from '../../../core/utils/validators';

export class InvalidCredentialsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsInputError';
  }
}

/**
 * Orchestrates the two-step login flow required by the backend:
 *   1. POST /oauth2/token            -> access_token
 *   2. GET  /membership-service/.../users/me (authenticated with access_token)
 *      -> memberships[0].token stored as org_token
 *
 * The repository implementation owns HOW each call is made; this use case
 * owns the business rule that a session isn't valid until BOTH tokens and
 * the user profile are available, and persists them atomically via the
 * repository before returning.
 */
export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<AuthSession> {
    if (!isNonEmptyString(credentials.username) || !isNonEmptyString(credentials.password)) {
      throw new InvalidCredentialsInputError('Username and password are required.');
    }

    return this.authRepository.login(credentials);
  }
}
