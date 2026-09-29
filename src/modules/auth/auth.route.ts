import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { loginUser, registerUser } from "./auth.service.js";
import { AppError } from "../../lib/app-error.js";

export async function authRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {

  //POST register
  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const result = await registerUser(
        parsed.data
      );

      return reply.status(201).send({
        data: result
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(
          error.statusCode
        ).send({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      app.log.error(
        { error },
        "User registration failed"
      );

      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong"
        }
      });
    }
  });

  //POST login
  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(
      request.body
    );

    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parsed.error.flatten()
        }
      });
    }

    try {
      const result = await loginUser(
        parsed.data
      );

      const accessToken = await reply.jwtSign({
        sub: result.user.id,
        organizationId:
          result.organization.id,
        roleId: result.role.id,
        role: result.role.name
      });

      return reply.status(200).send({
        data: {
          user: result.user,

          organization:
            result.organization,

          role: result.role,

          accessToken
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(
          error.statusCode
        ).send({
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      app.log.error(
        { error },
        "User login failed"
      );

      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong"
        }
      });
    }
  });
}