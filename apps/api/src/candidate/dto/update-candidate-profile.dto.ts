import { Type } from "class-transformer";
import { IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

class CandidatePersonalInfoDto {
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  paternalLastName?: string;

  @IsOptional()
  @IsString()
  maternalLastName?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  birthCountry?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  ethnicity?: string;

  @IsOptional()
  @IsString()
  ecuadorianCitizen?: string;

  @IsOptional()
  @IsString()
  onlineInterviews?: string;

  @IsOptional()
  @IsString()
  residentVisa?: string;

  @IsOptional()
  @IsString()
  willingToTravel?: string;

  @IsOptional()
  @IsString()
  driversLicense?: string;

  @IsOptional()
  @IsString()
  licenseType?: string;

  @IsOptional()
  @IsString()
  hasVehicle?: string;

  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  addressCountry?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  canton?: string;

  @IsOptional()
  @IsString()
  parish?: string;

  @IsOptional()
  @IsString()
  borderResident?: string;

  @IsOptional()
  @IsString()
  galapagosResident?: string;

  @IsOptional()
  @IsString()
  galapagosResidenceType?: string;

  @IsOptional()
  @IsString()
  mainStreet?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  secondaryStreet?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsString()
  familyPhone?: string;

  @IsOptional()
  @IsString()
  workPhone?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  email1?: string;

  @IsOptional()
  @IsString()
  email2?: string;

  @IsOptional()
  @IsString()
  hasDisability?: string;

  @IsOptional()
  @IsString()
  conadisNumber?: string;

  @IsOptional()
  @IsString()
  disabilityType?: string;

  @IsOptional()
  @IsString()
  disabilityPercentage?: string;
}

export class UpdateCandidateProfileDto {
  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CandidatePersonalInfoDto)
  personalInfo?: CandidatePersonalInfoDto;
}
