import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function start(): Promise<void> {
    const app = await buildApp();

    try {
        await app.listen({
            host: env.HOST,
            port: env.PORT
        });

        app.log.info(`PulseWatch API running on ${env.HOST}:${env.PORT}`);
    } catch (error) {
        app.log.error(error, "Failed to start server");

        process.exit(1);
    }
}

void start();