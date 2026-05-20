import { IsString, MinLength } from "class-validator";

import { SanitizeText } from "../../common/validation/sanitizers";

export class ResetPasswordDto {
  @SanitizeText()
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
