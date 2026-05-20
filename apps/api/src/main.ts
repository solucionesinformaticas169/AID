import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";

import { AppModule } from "./app.module";
import { RequestWithContext } from "./common/http/request-context.types";
import { AppLoggerService } from "./observability/app-logger.service";
import { GlobalExceptionFilter } from "./observability/global-exception.filter";
import { RequestContextService } from "./observability/request-context.service";
import { RequestLoggingInterceptor } from "./observability/request-logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logger = app.get(AppLoggerService);
  const requestContextService = app.get(RequestContextService);
  const corsOrigins = resolveCorsOrigins(configService);
  const enableSecurityHeaders =
    (configService.get<string>("ENABLE_SECURITY_HEADERS") ?? "true").toLowerCase() !== "false";
  const isProduction =
    (configService.get<string>("NODE_ENV") ?? "development").toLowerCase() === "production";

  app.useLogger(logger);
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use((request: RequestWithContext, response: express.Response, next: express.NextFunction) => {
    const requestId = request.headers["x-request-id"];
    const normalizedRequestId =
      typeof requestId === "string" && requestId.length > 0 ? requestId : randomUUID();

    request.requestId = normalizedRequestId;
    response.setHeader("x-request-id", normalizedRequestId);

    requestContextService.run(
      {
        requestId: normalizedRequestId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        ip: request.ip ?? undefined,
        userAgent: request.get("user-agent") ?? undefined,
      },
      next,
    );
  });
  app.use("/api/payments/webhooks", express.raw({ type: "application/json" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (enableSecurityHeaders) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            connectSrc: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            upgradeInsecureRequests: isProduction ? [] : null,
          },
        },
        frameguard: { action: "deny" },
        hsts: isProduction
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
        noSniff: true,
        referrerPolicy: {
          policy: "no-referrer",
        },
      }),
    );
  }
  app.use(cookieParser());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const allowVercelPreviews =
        (configService.get<string>("CORS_ALLOW_VERCEL_PREVIEWS") ?? "false").toLowerCase() === "true";

      if (allowVercelPreviews && origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} no autorizado por CORS.`));
    },
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
    }),
  );
  app.useGlobalInterceptors(app.get(RequestLoggingInterceptor));
  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  logger.info("AIDLABORAL API started", {
    context: "Bootstrap",
    event: "APP_BOOTSTRAP",
    port,
    environment: process.env.NODE_ENV ?? "development",
  });
}

function resolveCorsOrigins(configService: ConfigService) {
  const explicitOrigins = configService.get<string>("CORS_ORIGINS");

  if (explicitOrigins) {
    return explicitOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const frontendUrl = configService.get<string>("FRONTEND_URL");
  return frontendUrl ? [frontendUrl] : ["http://localhost:3000"];
}

void bootstrap();
