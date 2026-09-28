import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function healthRoutes(app: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    app.get("/health", async () => {
        return {
            status: "ok",
            service: "pulsewatch-api"
        };
    });

    app.get("/ready", async() => {
        return {
            status: "ok",
            checks: {
                process: "ok"
            }
        };
    });
}