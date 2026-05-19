import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>;
}
