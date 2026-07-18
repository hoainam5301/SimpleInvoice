import type { AuthRepository } from '../../repositories/AuthRepository';

/**
 * Deliberately trivial today, but kept as its own use case because "logout"
 * is a business action, not a storage detail: it's the seam where we'd add
 * server-side session revocation, analytics resets, or push-token
 * unregistration without touching the repository or the UI layer.
 */
export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.logout();
  }
}
