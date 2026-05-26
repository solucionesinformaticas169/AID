import { IsInt, IsString, Min } from "class-validator";

export class ConfirmPayphoneButtonDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  clientTransactionId!: string;
}
