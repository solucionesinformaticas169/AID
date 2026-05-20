import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

import type { RequestContextSnapshot } from "../common/http/request-context.types";

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextSnapshot>();

  run(context: RequestContextSnapshot, callback: () => void) {
    this.storage.run(context, callback);
  }

  get() {
    return this.storage.getStore();
  }

  set(partial: Partial<RequestContextSnapshot>) {
    const current = this.storage.getStore();

    if (!current) {
      return;
    }

    Object.assign(current, partial);
  }
}
