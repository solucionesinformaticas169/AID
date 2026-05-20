import { Injectable, NotFoundException } from "@nestjs/common";

import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersRepository } from "./repositories/users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getAll(roleCode?: string) {
    return this.usersRepository.findAll(roleCode);
  }

  async getById(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado.`);
    }

    return user;
  }

  updateById(id: string, payload: UpdateUserDto) {
    return this.usersRepository.updateById(id, payload);
  }

  async setActiveStatus(id: string, isActive: boolean) {
    await this.getById(id);
    return this.usersRepository.updateById(id, { isActive });
  }
}
