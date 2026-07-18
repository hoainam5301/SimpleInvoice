import { mapUserDtoToEntity } from '../../../src/data/mappers/authMapper';
import type { UserResponseDto } from '../../../src/data/dto/UserDto';

describe('mapUserDtoToEntity', () => {
  it('maps a full user with memberships', () => {
    const dto: UserResponseDto = {
      data: {
        userId: 'u1',
        fullName: 'Jane Doe',
        memberships: [
          { membershipId: 'm1', organisationId: 'o1', organisationName: 'Acme', token: 'tok' },
        ],
      },
    };
    const user = mapUserDtoToEntity(dto);
    expect(user).toEqual({
      id: 'u1',
      fullName: 'Jane Doe',
      memberships: [{ organizationId: 'o1', organizationName: 'Acme', token: 'tok' }],
    });
  });

  it('derives fullName from first + last when fullName is missing, and defaults memberships to []', () => {
    const dto = {
      data: { userId: 'u2', firstName: 'John', lastName: 'Smith' },
    } as unknown as UserResponseDto;
    const user = mapUserDtoToEntity(dto);
    expect(user.fullName).toBe('John Smith');
    expect(user.memberships).toEqual([]);
  });
});
