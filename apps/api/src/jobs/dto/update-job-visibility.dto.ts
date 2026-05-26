import { IsBoolean } from "class-validator";

export class UpdateJobVisibilityDto {
  @IsBoolean()
  isActive!: boolean;
}
