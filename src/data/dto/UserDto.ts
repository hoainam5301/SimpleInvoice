/** Wire shape of GET /membership-service/1.0.0/users/me (wrapped in `data`). */
export interface MembershipDto {
  membershipId: string;
  organisationId: string;
  organisationName: string;
  token: string;
}

export interface UserDataDto {
  userId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  memberships?: MembershipDto[];
}

export interface UserResponseDto {
  data: UserDataDto;
}
