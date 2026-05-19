import { IsOptional, IsString } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  taxId?: string;
}
