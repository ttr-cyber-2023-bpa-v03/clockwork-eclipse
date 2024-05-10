import http from "http";
import https from "https";
import { promises as fs } from "fs";
import path from "path";
import express from "express";
import { Server as WebSocketServer } from "socket.io";
import { validatePort } from "../helpers";

import { register as registerRoute } from "./route";
import { register as registerStatic } from "./static";

export interface HostOptions {
    address?: string;
    http: {
        port?: number;         // Port for HTTPS
        insecurePort?: number; // Port for HTTP (NOT recommended)
        key?: string;
        keyFile?: string;
        cert?: string; 
        certFile?: string;
        websocket?: boolean;
    };
}

export class Host {
    private options!: HostOptions;
    public httpServer?: http.Server;
    public httpsServer?: https.Server;
    private app?: express.Application;
    private socket?: WebSocketServer;

    public get address() {
        return this.options.address;
    }

    public get port() {
        return this.options.http.port;
    }

    public get insecurePort() {
        return this.options.http.insecurePort;
    }

    public get express() {
        if (this.app === undefined)
            throw new Error("Express application does not exist");
        return this.app;
    }

    public get io() {
        if (this.socket === undefined)
            throw new Error("WebSocket application does not exist");
        return this.socket;
    }

    private static async processOptions(options: HostOptions): Promise<void> {
        if (!options.http)
            throw new Error("Must have at least one server");

        // Default to loopback address
        options.address ??= "127.0.0.1";

        // Set up http server for initialization
        let http: typeof options.http | undefined;
        if (http = options.http) {
            if (options.http.insecurePort && !validatePort(options.http.insecurePort))
                throw new Error("Invalid HTTP port");

            if (options.http.port) {
                if (!validatePort(options.http.port))
                    throw new Error("Invalid HTTPS port");

                if (!options.http.key) {
                    if (!options.http.keyFile)
                        throw new Error("Expected 'key' or 'keyFile' for HTTPS");

                    const contents = await fs.readFile(options.http.keyFile, "utf8");
                    options.http.key = contents;
                }

                if (!options.http.cert) {
                    if (!options.http.certFile)
                        throw new Error("Expected 'cert' or 'certFile' for HTTPS");

                    const contents = await fs.readFile(options.http.certFile, "utf8");
                    options.http.cert = contents;
                }
            }
        }
    }

    private async init(options: HostOptions) {
        // Preprocess the options, basically validate and ensure that we have all
        // the data we need to get started with the servers
        await Host.processOptions(options);

        // Create the HTTP server if it's enabled
        if (options.http.insecurePort !== undefined)
            this.httpServer = http.createServer();

        // Create the HTTPS server if it's enabled
        if (options.http.port !== undefined)
            this.httpsServer = https.createServer({
                key: options.http.key,
                cert: options.http.cert
            });

        // Initialize express
        this.app = express();
        this.httpServer?.on("request", this.app);
        this.httpsServer?.on("request", this.app);

        // Create the WebSocket server if it's enabled
        if (options.http.websocket === true) {
            this.socket = new WebSocketServer();

            if (this.httpServer !== undefined)
                this.socket.attach(this.httpServer);

            if (this.httpsServer !== undefined)
                this.socket.attach(this.httpsServer);
        }
    }

    // Stub to prevent direct instantiation
    private constructor() {}

    public static async create(options: HostOptions): Promise<Host> {
        const host = new Host();

        host.options = options;
        await host.init(options);

        return host;
    }

    public start() {
        const promises: Promise<void>[] = [];

        // Start the HTTP server if it's enabled
        if (this.httpServer !== undefined)
            promises.push(new Promise<void>(resolve => this.httpServer!.listen(this.options.http.insecurePort!, () => resolve())));

        // Start the HTTPS server if it's enabled
        if (this.httpsServer !== undefined)
            promises.push(new Promise<void>(resolve => this.httpsServer!.listen(this.options.http.port!, () => resolve())));

        return Promise.all(promises);
    }

    public stop() {
        const promises: Promise<void>[] = [];

        // Stop the WebSocket server if it's enabled
        if (this.socket !== undefined)
            promises.push(new Promise<void>(resolve => this.socket!.close(() => resolve())));

        // Stop the HTTP server if it's enabled
        if (this.httpServer !== undefined)
            promises.push(new Promise<void>(resolve => this.httpServer!.close(() => resolve())));

        // Stop the HTTPS server if it's enabled
        if (this.httpsServer !== undefined)
            promises.push(new Promise<void>(resolve => this.httpsServer!.close(() => resolve())));

        return Promise.all(promises);
    }

    public async loadRoutes(routesDir: string) {
        const entries = await fs.readdir(routesDir, { withFileTypes: true });
        const files = entries.filter(file => file.isFile() && /\.[tj]s$/.test(file.name));

        for (const file of files) {
            const routePath = path.join(routesDir, file.name);
            const module = await import(`file://${routePath}`);

            if (!module.default) {
                console.warn(`No export in ${routePath}`);
                continue;
            }

            const type = Reflect.getMetadata("meta:type", module.default);
            switch (type) {
                case "Route":
                    registerRoute(this.express, module.default);
                    break;
                case "StaticRoute":
                    registerStatic(this.express, module.default);
                    break;
            }
        }

        const dirs = entries.filter(dir => dir.isDirectory());
        for (const dir of dirs) {
            const dirPath = path.join(routesDir, dir.name);
            await this.loadRoutes(dirPath);
        }
    }
}
