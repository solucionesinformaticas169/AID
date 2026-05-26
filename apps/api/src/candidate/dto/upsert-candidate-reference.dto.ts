import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpsertCandidateReferenceDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  relationship!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;
}
