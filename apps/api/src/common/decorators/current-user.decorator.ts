import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type {
  AuthenticatedRequestUser,
  RequestWithContext,
} from "../http/request-context.types";

export type AuthenticatedUser = AuthenticatedRequestUser;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    return request.user;
  },
);
