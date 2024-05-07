import "reflect-metadata";
import "dotenv/config";
import "@logic/console";

import paths from "@src/paths";
import path from "path";

import { Host } from "@logic/server";

const host = await Host.create({
    http: { 
        port: 8443,
        insecurePort: 8080,
        websocket: false,
        keyFile: path.join(paths.rootDir, "certs", "server.pem"),
        certFile: path.join(paths.rootDir, "certs", "server.crt")
    }
});

// Load the routes
const routesPath = path.join(paths.sourceDir, "routes");
await host.loadRoutes(routesPath);

// Start the servers
await host.start();
console.info(`HTTPS server started @ https://localhost:${host.port}/`);

// Graceful shutdown
process.on("SIGINT", async () => {
    console.info("Stopping servers...");
    await host.stop();
    process.exit(0);
});