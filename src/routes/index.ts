import express from "express";

import { Route } from "@logic/server/route";
import { Endpoint } from "@logic/server/endpoint";

@Route("/")
export default class RootRoute {
    @Endpoint("GET", "/")
    public async root(req: express.Request, res: express.Response) {
        res.status(200).end("Hello, world!");
    }
}