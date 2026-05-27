import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

const EMAIL_TEMPLATE_KINDS = [
  "VERIFY_EMAIL",
  "PASSWORD_RESET",
  "APPLICATION_SUBMITTED",
  "NEW_APPLICATION",
  "JOB_PUBLISHED",
] as const;

export class ListEmailDeliveriesDto {
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @IsOptional()
  @IsIn(EMAIL_TEMPLATE_KINDS)
  templateKind?: (typeof EMAIL_TEMPLATE_KINDS)[number];

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
