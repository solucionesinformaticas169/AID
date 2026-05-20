import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class DocumentUrlQueryDto {
  @IsOptional()
  @Transform(({ value }) => String(value).toLowerCase() === "true")
  @IsBoolean()
  download?: boolean;
}
