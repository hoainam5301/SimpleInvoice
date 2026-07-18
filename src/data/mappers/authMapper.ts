import type { UserResponseDto } from '../dto/UserDto';
import type { User } from '../../domain/entities/User';

/**
 * Translates wire format (the `data`-wrapped /users/me response) into the
 * domain's `User` entity. If the backend renames a field or changes the
 * response contract, only this file changes — domain/use cases and
 * presentation are unaffected.
 */
export function mapUserDtoToEntity(dto: UserResponseDto): User {
  const data = dto.data;
  return {
    id: data.userId,
    fullName: data.fullName ?? [data.firstName, data.lastName].filter(Boolean).join(' '),
    memberships: (data.memberships ?? []).map(m => ({
      organizationId: m.organisationId,
      organizationName: m.organisationName,
      token: m.token,
    })),
  };
}
