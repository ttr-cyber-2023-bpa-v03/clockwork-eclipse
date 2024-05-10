import express from "express";
import c from "ansi-colors";

import { register as registerEndpoint } from "./endpoint";

export function Route(path: string) {
    return function (target: any) {
        Reflect.defineMetadata("meta:type", "Route", target);
        Reflect.defineMetadata("meta:path", path, target);
    }
}

export function UseRoutes(...routes: Object[]) {
    return function (target: any) {
        Reflect.defineMetadata("meta:nestedRoutes", routes, target);
    }
}

export function register(obj: express.Application | express.Router, route: Object) {
    const prototype = (route as any).prototype;

    const path: string = Reflect.getMetadata("meta:path", route);
    const middlewares: express.Handler[] = Reflect.getMetadata("meta:middlewares", route) || [];
    const endwares: express.Handler[] = Reflect.getMetadata("meta:endwares", route) || [];
    const nestedRoutes = Reflect.getMetadata("meta:nestedRoutes", route) || [];

    let fullPath = Reflect.getMetadata("meta:path", obj) || "";
    fullPath += path;

    const router = express.Router();
    Reflect.defineMetadata("meta:path", path, router); // Save the path for use in nested calls

    // Use the middlewares, which are applied before the route methods
    if (middlewares.length > 0)
        router.use(middlewares);

    // Handle nested routes
    for (const nestedRoute of nestedRoutes)
        register(router, nestedRoute);

    // Register the endpoints
    const endpointData: [string, string, string][] = [];
    for (const key of Object.getOwnPropertyNames(prototype)) {
        if (Reflect.getMetadata("meta:type", prototype, key) === "endpoint")
            endpointData.push(registerEndpoint(router, [prototype, key]));
    }

    // Use the endwares, which are applied after the route methods
    if (endwares.length > 0)
        router.use(endwares);

    // wtf
    obj.use(path as any, router);

    console.debug(`${c.red("ROUTE")} ${c.blueBright(fullPath)}, ${c.yellow(middlewares.length.toString())} ${c.green("MIDDLEWARES")}, ${c.yellow(endwares.length.toString())} ${c.green("ENDWARES")}, ${c.yellow(endpointData.length.toString())} ${c.green("ENDPOINTS")}`);
}