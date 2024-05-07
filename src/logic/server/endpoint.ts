import express from "express";

export type ExpressMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "ALL";

export function Endpoint(method: ExpressMethod, path?: string) {
    return function (target: any, key: string) {
        Reflect.defineMetadata("meta:type", "endpoint", target, key);
        Reflect.defineMetadata("meta:method", method.toLowerCase(), target, key);
        Reflect.defineMetadata("meta:path", path, target, key);
    }
}

export function assert([prototype, key]: [Object, string]) {
    return Reflect.getMetadata("meta:type", prototype, key) === "endpoint";
}

export function register(obj: express.Router | express.Application, [prototype, key]: [Object, string]): [string, string, string] {
    const method = Reflect.getMetadata("meta:method", prototype, key);
    let path = Reflect.getMetadata("meta:path", prototype, key);
    if (path === undefined) {
        if (!key.startsWith(method))
            throw new Error("Implicit path requires method prefix");
        path = '/' + key[method.length].toLowerCase() + key.substr(method.length + 1)
    }
    const middlewares = Reflect.getMetadata("meta:middlewares", prototype, key) || [];
    const handler = prototype[key];

    obj[method](path, ...middlewares, handler);
    return [method, path, key];
}