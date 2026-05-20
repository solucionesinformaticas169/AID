import { Global, Module } from "@nestjs/common";

import { AppLoggerService } from "./app-logger.service";
import { RequestContextService } from "./request-context.service";
import { RequestLoggingInterceptor } from "./request-logging.interceptor";

@Global()
@Module({
  providers: [AppLoggerService, RequestContextService, RequestLoggingInterceptor],
  exports: [AppLoggerService, RequestContextService, RequestLoggingInterceptor],
})
export class ObservabilityModule {}
