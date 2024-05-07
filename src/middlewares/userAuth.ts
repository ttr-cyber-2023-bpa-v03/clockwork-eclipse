import express from "express";
import { Security } from "@utils/security";

export default function(req: express.Request, res: express.Response, next: express.NextFunction) {
    // Check for a Bearer token header
    let token = req.headers["authorization"];

    if (!token || !token.startsWith("Bearer "))
        return res.status(401).json({ error: "Unauthorized" });
    token = token.substring("Bearer ".length);
    
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