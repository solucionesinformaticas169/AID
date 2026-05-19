import { Body, Controller, Get, Post } from "@nestjs/common";

import { UploadsService } from "./uploads.service";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get("documents")
  getCandidateDocuments() {
    return this.uploadsService.getCandidateDocuments();
  }

  @Post("documents")
  registerDocument(@Body() payload: Record<string, unknown>) {
    return this.uploadsService.registerDocument(payload);
  }
}
