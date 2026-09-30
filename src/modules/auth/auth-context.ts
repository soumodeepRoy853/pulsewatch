import type { FastifyRequest } from "fastify";

export function getAuthContext(
  request: FastifyRequest
) {
  return {
    userId: request.user.sub,
    organizationId:
      request.user.organizationId,
    roleId: request.user.roleId,
    role: request.user.role
  };
}