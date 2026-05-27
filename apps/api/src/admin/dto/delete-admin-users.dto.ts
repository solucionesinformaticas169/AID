import { ArrayNotEmpty, IsArray, IsEmail } from "class-validator";

export class DeleteAdminUsersDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails!: string[];
}
