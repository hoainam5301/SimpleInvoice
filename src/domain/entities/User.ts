export interface Membership {
  organizationId: string;
  organizationName: string;
  token: string;
}

export interface User {
  id: string;
  fullName: string;
  /** Not returned by the sandbox /users/me — kept optional for other envs. */
  email?: string;
  memberships: Membership[];
}
