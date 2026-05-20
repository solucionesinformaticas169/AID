import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from "@nestjs/throttler";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req.headers?.["x-forwarded-for"];
    const candidate = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate.split(",")[0]?.trim() ?? req.ip;
    }

    return req.ip ?? req.socket?.remoteAddress ?? "unknown";
  }

  protected async getErrorMessage(context: ExecutionContext): Promise<string> {
    if (context.getType() !== "http") {
      return "Too many requests.";
    }

    return "Demasiadas solicitudes desde esta IP. Intenta nuevamente en unos minutos.";
  }
}
