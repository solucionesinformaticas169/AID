import { IsEmail } from "class-validator";

import { NormalizeEmail } from "../../common/validation/sanitizers";

export class ResendVerificationDto {
  @NormalizeEmail()
  @IsEmail()
  email!: string;
}
