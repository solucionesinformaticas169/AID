import { IsIn, IsOptional, IsString } from "class-validator";

import { ROLE_CODES } from "../../common/constants/role-codes";

const MANAGED_ROLE_CODES = [
  ROLE_CODES.CANDIDATE,
  ROLE_CODES.RECRUITER,
  ROLE_CODES.SYSTEM_ADMIN,
] as const;

export class ListAdminUsersDto {
  @IsOptional()
  @IsString()
  @IsIn(MANAGED_ROLE_CODES)
  roleCode?: (typeof MANAGED_ROLE_CODES)[number];
}
