import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import { CreateVacancyDto, VacanciesService } from "./vacancies.service";

@Controller("vacancies")
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get("public")
  getPublicVacancies() {
    return this.vacanciesService.getPublicVacancies();
  }

  @Get(":id")
  getVacancyById(@Param("id") id: string) {
    return this.vacanciesService.getVacancyById(id);
  }

  @Post()
  createVacancy(@Body() payload: CreateVacancyDto) {
    return this.vacanciesService.createVacancy(payload);
  }
}
