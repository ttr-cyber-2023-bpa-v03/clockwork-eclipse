import express from "express";
import c from "ansi-colors";

export function Static(path: string, pointer: string) {
    return function(target: any) {
        Reflect.defineMetadata("meta:type", "StaticRoute", target);
        Reflect.defineMetadata("meta:path", path, target);
        Reflect.defineMetadata("meta:pointer", pointer, target);
    }
}

export function register(obj: express.Application | express.Router, route: Object) {
    const path = Reflect.getMetadata("meta:path", route);
    const pointer = Reflect.getMetadata("meta:pointer", route);

    // Weird type issue i can't bother to debug because this is valid and documented
    // Probably an issue with Express.js and not this code
    obj.use(path, express.static(pointer) as any);

    // Log the static route
    console.debug(`${c.red("STATIC")} ${c.blueBright(path)} -> ${c.magenta(pointer)}`);
}
