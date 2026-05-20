import { IsString, MinLength } from "class-validator";

import { SanitizeText } from "../../common/validation/sanitizers";

export class VerifyEmailDto {
  @SanitizeText()
  @IsString()
  @MinLength(20)
  token!: string;
}
