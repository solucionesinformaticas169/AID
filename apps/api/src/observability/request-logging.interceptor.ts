import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";

import type { RequestWithContext } from "../common/http/request-context.types";
import { AppLoggerService } from "./app-logger.service";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        this.logger.info("HTTP request completed", {
          context: RequestLoggingInterceptor.name,
          event: "HTTP_REQUEST_COMPLETED",
          method: request.method,
          route: request.originalUrl ?? request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          userId: request.user?.sub ?? null,
          userRole: request.user?.role ?? null,
          companyId: request.user?.companyId ?? null,
          ip: request.ip ?? null,
          userAgent: request.get("user-agent") ?? null,
          requestId: request.requestId,
        });
      }),
    );
  }
}
