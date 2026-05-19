import { Body, Controller, Get, Param, Patch } from "@nestjs/common";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { ROLE_CODES } from "../common/constants/role-codes";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(ROLE_CODES.SYSTEM_ADMIN)
  @Get()
  getAll() {
    return this.usersService.getAll();
  }

  @Get("me")
  getMe(@CurrentUser() user: { sub: string }) {
    return this.usersService.getById(user.sub);
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.usersService.getById(id);
  }

  @Patch(":id")
  updateById(@Param("id") id: string, @Body() payload: UpdateUserDto) {
    return this.usersService.updateById(id, payload);
  }
}
