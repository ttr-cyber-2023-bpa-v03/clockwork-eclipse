import express from "express";

import { Route, Endpoint } from "@logic/server";

@Route("/api")
export default class RootRoute {
    @Endpoint("GET", "/")
    public async root(req: express.Request, res: express.Response) {
        res.status(200).json({ status: "OK" });
    }
}