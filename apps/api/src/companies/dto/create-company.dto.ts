import { IsOptional, IsString } from "class-validator";

import { SanitizeText } from "../../common/validation/sanitizers";

export class CreateCompanyDto {
  @SanitizeText()
  @IsString()
  name!: string;

  @SanitizeText()
  @IsString()
  slug!: string;

  @IsOptional()
  @SanitizeText()
  @IsString()
  taxId?: string;
}
