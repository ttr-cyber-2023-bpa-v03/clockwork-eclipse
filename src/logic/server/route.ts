import express from "express";
import c from "ansi-colors";

import * as endpointLogic from "./endpoint";

export function Route(path: string) {
    return function (target: any) {
        Reflect.defineMetadata("meta:type", "route", target);
        Reflect.defineMetadata("meta:path", path, target);
    }
}

export function UseRoutes(...routes: Object[]) {
    return function (target: any) {
        Reflect.defineMetadata("meta:nestedRoutes", routes, target);
    }
}

export function assert(obj: any) {
    return Reflect.getMetadata("meta:type", obj) === "route";
}

export function register(obj: express.Application | express.Router, route: Object) {
    if (!assert(route))
        throw new Error("Not a route");

    const prototype = (route as any).prototype;

    const rtPath = Reflect.getMetadata("meta:path", route)
    const rtMiddlewares = Reflect.getMetadata("meta:middlewares", route) || [];
    const rtEndwares = Reflect.getMetadata("meta:endwares", route) || [];
    const nestedRoutes = Reflect.getMetadata("meta:nestedRoutes", route) || [];

    let fullPath = Reflect.getMetadata("meta:path", obj) || "";
    fullPath += rtPath;

    const router = express.Router();
    Reflect.defineMetadata("meta:path", rtPath, router); // Save the path for use in nested calls

    // Use the middlewares, which are applied before the route methods
    if (rtMiddlewares.length > 0)
        router.use(rtMiddlewares);

    // Handle nested routes
    for (const nestedRoute of nestedRoutes)
        register(router, nestedRoute);

    // Register the endpoints
    const endpointData: [string, string, string][] = [];
    for (const key of Object.getOwnPropertyNames(prototype)) {
        if (endpointLogic.assert([prototype, key]))
            endpointData.push(endpointLogic.register(router, [prototype, key]));
    }

    // Use the endwares, which are applied after the route methods
    if (rtEndwares.length > 0)
        router.use(rtEndwares);

    obj.use(rtPath, router);

    console.debug(`${c.red("ROUTE")} ${c.blueBright(fullPath)}`);
    console.debug(`  - ${c.yellow(rtMiddlewares.length)} ${c.green("MIDDLEWARES")}`);
    console.debug(`  - ${c.yellow(rtEndwares.length)} ${c.green("ENDWARES")}`);
    console.debug(`  - ${c.yellow(nestedRoutes.length)} ${c.green("ROUTES")}`);
    console.debug("  --- ENDPOINTS ---");
    for (const [method, path, key] of endpointData)
        console.debug(`  - ${c.red(method.toUpperCase())} ${c.blueBright(path)} => ${c.magenta(key)}`);
    console.debug();
}