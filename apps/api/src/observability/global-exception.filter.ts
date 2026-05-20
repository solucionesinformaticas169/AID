import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

import type { RequestWithContext } from "../common/http/request-context.types";
import { AppLoggerService } from "./app-logger.service";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithContext>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const isProduction = (process.env.NODE_ENV ?? "development").toLowerCase() === "production";
    const payload = this.buildResponsePayload(exception, statusCode, request.requestId, isProduction);
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error("Unhandled request exception", {
      context: GlobalExceptionFilter.name,
      event: "HTTP_EXCEPTION",
      method: request.method,
      route: request.originalUrl ?? request.url,
      statusCode,
      requestId: request.requestId,
      userId: request.user?.sub ?? null,
      userRole: request.user?.role ?? null,
      companyId: request.user?.companyId ?? null,
      ip: request.ip ?? null,
      userAgent: request.get("user-agent") ?? null,
      exceptionName: exception instanceof Error ? exception.name : "UnknownException",
      stack: isProduction ? undefined : stack,
      error: this.extractErrorResponse(exception),
    });

    response.status(statusCode).json(payload);
  }

  private buildResponsePayload(
    exception: unknown,
    statusCode: number,
    requestId: string | undefined,
    isProduction: boolean,
  ) {
    const base = {
      statusCode,
      requestId,
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof HttpException) {
      const errorResponse = exception.getResponse();
      const message =
        typeof errorResponse === "string"
          ? errorResponse
          : Array.isArray((errorResponse as { message?: unknown }).message)
            ? (errorResponse as { message: unknown[] }).message
            : (errorResponse as { message?: unknown }).message ?? exception.message;

      return {
        ...base,
        message,
        error:
          typeof errorResponse === "string"
            ? exception.name
            : (errorResponse as { error?: string }).error ?? exception.name,
      };
    }

    return {
      ...base,
      message: isProduction ? "Ocurrio un error interno. Intenta nuevamente." : this.stringifyUnknown(exception),
      error: "InternalServerError",
    };
  }

  private extractErrorResponse(exception: unknown) {
    if (exception instanceof HttpException) {
      return exception.getResponse();
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
      };
    }

    return {
      message: this.stringifyUnknown(exception),
    };
  }

  private stringifyUnknown(exception: unknown) {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === "string") {
      return exception;
    }

    return "Error desconocido";
  }
}
