import { IsEmail } from "class-validator";

import { NormalizeEmail } from "../../common/validation/sanitizers";

export class RequestPasswordResetDto {
  @NormalizeEmail()
  @IsEmail()
  email!: string;
}
