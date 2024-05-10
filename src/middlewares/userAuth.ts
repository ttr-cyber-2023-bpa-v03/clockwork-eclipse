import express from "express";
import { Security } from "@utils/security";

import promisify from "util.promisify";
import cookieParser from "cookie-parser";
const parseCookies = promisify(cookieParser());

export default async function(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Parse the cookies
    await parseCookies(req, res);
    let token = req.cookies["userToken"];
    
    // Verify the token
    let user: any;
    try {
        user = Security.decodeToken(token);
        if (!user.user) throw new Error();
    }
    catch (e) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = user.id;
    next();
};