import type { FastifyRequest } from "fastify";

import type { AuthTokenPayload } from "./auth.types.js";

export async function authenticate(
  request: FastifyRequest
): Promise<void> {
  await request.jwtVerify();
}