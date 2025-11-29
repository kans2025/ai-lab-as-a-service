import { HttpRequest } from "@azure/functions";

export const getUserIdFromReq = (req: HttpRequest): string => {
  // POC: derive user from header.
  // Later: parse B2C JWT and use oid/email.
  return (req.headers["x-demo-user-id"] as string) || "demo-user";
};

