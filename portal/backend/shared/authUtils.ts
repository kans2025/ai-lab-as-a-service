import { HttpRequest } from "@azure/functions";

export const getUserIdFromReq = (req: HttpRequest | any): string => {
  const headers: any = (req as any).headers || {};

  const fromGet =
    headers.get?.("x-demo-user-id") ??
    headers.get?.("X-Demo-User-Id");

  const fromIndex =
    headers["x-demo-user-id"] ||
    headers["X-Demo-User-Id"];

  return (fromGet || fromIndex || "demo-user") as string;
};
