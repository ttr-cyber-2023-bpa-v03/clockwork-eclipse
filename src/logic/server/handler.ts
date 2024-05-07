import express from "express";

export function UseMiddlewares(...middlewares: express.RequestHandler[]) {
    return function (target: any, key?: string) {
        if (key !== undefined)
            Reflect.defineMetadata("meta:middlewares", middlewares, target, key);
        else
            Reflect.defineMetadata("meta:middlewares", middlewares, target);
    }
}

export function UseEndwares(...middlewares: express.RequestHandler[]) {
    return function (target: any) {
        Reflect.defineMetadata("meta:endwares", middlewares, target);
    }
}