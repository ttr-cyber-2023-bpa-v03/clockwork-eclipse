import express from "express";

export enum ExpressMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    OPTIONS = "OPTIONS",
    HEAD = "HEAD",
    ALL = "ALL"
}

export function Endpoint(method: ExpressMethod[keyof ExpressMethod], path?: string) {
    return function(target: any, key: string) {
        Reflect.defineMetadata("meta:type", "endpoint", target, key);
        Reflect.defineMetadata("meta:method", (method as string).toLowerCase(), target, key);
        Reflect.defineMetadata("meta:path", path, target, key);
    }
}

export function register(obj: express.Router | express.Application, [prototype, key]: [Object, string]): [string, string, string] {
    const method = Reflect.getMetadata("meta:method", prototype, key);

    let path = Reflect.getMetadata("meta:path", prototype, key);
    if (path === undefined) {
        if (!key.startsWith(method))
            throw new Error("Implicit path requires method prefix");
        path = '/' + key[method.length].toLowerCase() + key.substring(method.length + 1)
    }

    const middlewares = Reflect.getMetadata("meta:middlewares", prototype, key) || [];
    const handler = prototype[key];

    obj[method](path, ...middlewares, handler);
    return [method, path, key];
}