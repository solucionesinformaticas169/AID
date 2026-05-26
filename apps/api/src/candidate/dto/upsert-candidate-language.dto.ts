import { IsNotEmpty, IsString } from "class-validator";

export class UpsertCandidateLanguageDto {
  @IsString()
  @IsNotEmpty()
  language!: string;

  @IsString()
  @IsNotEmpty()
  spokenLevel!: string;

  @IsString()
  @IsNotEmpty()
  writtenLevel!: string;
}
