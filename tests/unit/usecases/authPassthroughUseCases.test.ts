import { LogoutUseCase } from '../../../src/domain/usecases/auth/LogoutUseCase';
import { RestoreSessionUseCase } from '../../../src/domain/usecases/auth/RestoreSessionUseCase';
import type { AuthRepository } from '../../../src/domain/repositories/AuthRepository';
import type { AuthSession } from '../../../src/domain/entities/Auth';

function makeAuthRepositoryMock(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    login: jest.fn(),
    logout: jest.fn(),
    restoreSession: jest.fn(),
    getCurrentUser: jest.fn(),
    ...overrides,
  };
}

describe('LogoutUseCase', () => {
  it('delegates to the repository logout', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const repo = makeAuthRepositoryMock({ logout });

    await new LogoutUseCase(repo).execute();

    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('RestoreSessionUseCase', () => {
  it('returns the restored session when one exists', async () => {
    const session: AuthSession = {
      user: { id: '1', fullName: 'Jane Doe', memberships: [] },
      accessToken: 'a',
      orgToken: 'o',
    };
    const repo = makeAuthRepositoryMock({
      restoreSession: jest.fn().mockResolvedValue(session),
    });

    await expect(new RestoreSessionUseCase(repo).execute()).resolves.toBe(session);
  });

  it('returns null (not an error) when there is no valid session', async () => {
    const repo = makeAuthRepositoryMock({
      restoreSession: jest.fn().mockResolvedValue(null),
    });

    await expect(new RestoreSessionUseCase(repo).execute()).resolves.toBeNull();
  });
});
