import "@fastify/jwt";

import type { AuthTokenPayload } from "../modules/auth/auth.types.ts";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: AuthTokenPayload,
        user: AuthTokenPayload;
    }
}