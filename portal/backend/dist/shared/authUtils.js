"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdFromReq = void 0;
const getUserIdFromReq = (req) => {
    const headers = req.headers || {};
    const fromGet = headers.get?.("x-demo-user-id") ??
        headers.get?.("X-Demo-User-Id");
    const fromIndex = headers["x-demo-user-id"] ||
        headers["X-Demo-User-Id"];
    return (fromGet || fromIndex || "demo-user");
};
exports.getUserIdFromReq = getUserIdFromReq;
