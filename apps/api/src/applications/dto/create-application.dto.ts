import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateApplicationDto {
  @IsString()
  jobOfferId!: string;

  @IsString()
  candidateProfileId!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  coverLetter?: string;

  @IsArray()
  @IsString({ each: true })
  selectedEducationIds!: string[];

  @IsArray()
  @IsString({ each: true })
  selectedWorkExperienceIds!: string[];

  @IsArray()
  @IsString({ each: true })
  selectedCertificationIds!: string[];
}
