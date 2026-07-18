import { LoginUseCase, InvalidCredentialsInputError } from '../../../src/domain/usecases/auth/LoginUseCase';
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

describe('LoginUseCase', () => {
  it('delegates valid credentials to the repository and returns its session', async () => {
    const session: AuthSession = {
      user: { id: '1', fullName: 'Jane Doe', email: 'jane@example.com', memberships: [] },
      accessToken: 'access-123',
      orgToken: 'org-456',
    };
    const repository = makeAuthRepositoryMock({ login: jest.fn().mockResolvedValue(session) });
    const useCase = new LoginUseCase(repository);

    const result = await useCase.execute({ username: 'jane', password: 'password123' });

    expect(repository.login).toHaveBeenCalledWith({ username: 'jane', password: 'password123' });
    expect(result).toBe(session);
  });

  it('rejects with InvalidCredentialsInputError when username is blank, without calling the repository', async () => {
    const repository = makeAuthRepositoryMock();
    const useCase = new LoginUseCase(repository);

    await expect(useCase.execute({ username: '  ', password: 'password123' })).rejects.toThrow(
      InvalidCredentialsInputError,
    );
    expect(repository.login).not.toHaveBeenCalled();
  });

  it('rejects with InvalidCredentialsInputError when password is blank', async () => {
    const repository = makeAuthRepositoryMock();
    const useCase = new LoginUseCase(repository);

    await expect(useCase.execute({ username: 'jane', password: '' })).rejects.toThrow(
      InvalidCredentialsInputError,
    );
    expect(repository.login).not.toHaveBeenCalled();
  });

  it('propagates repository errors unchanged', async () => {
    const failure = new Error('network down');
    const repository = makeAuthRepositoryMock({ login: jest.fn().mockRejectedValue(failure) });
    const useCase = new LoginUseCase(repository);

    await expect(useCase.execute({ username: 'jane', password: 'password123' })).rejects.toBe(
      failure,
    );
  });
});
