import express from "express";

import { Route } from "@logic/server/route";
import { Endpoint } from "@logic/server/endpoint";
import { UseMiddlewares } from "@logic/server/middleware";

import prisma from "@logic/prisma";
import { User, IUser, DatabaseError, UserAuthError } from "@models/user";

import bodyParser from "body-parser";
import UserAuth from "@middlewares/userAuth";

@Route("/api/users")
export default class UsersRoute {
    @Endpoint("GET", "/")
    public async root(req: express.Request, res: express.Response) {
        res.status(200).json({ status: "OK" });
    }

    /*
        TODO: Implementation of a captcha system, such as Cloudflare Turnstile might be
        a good idea here to counteract bots.
    */
    @Endpoint("POST", "/signup")
    @UseMiddlewares(bodyParser.json())
    public async signup(req: express.Request, res: express.Response) {
        const { email, password, username } = req.body ?? {} as { 
            email: string,
            password: string,
            username: string
        };

        if (!email)
            return res.status(400).json({ error: "Field 'email' is required" });
        if (!password)
            return res.status(400).json({ error: "Field 'password' is required" });
        if (!username)
            return res.status(400).json({ error: "Field 'username' is required" });

        try {
            const user = await User.create({ email, password, username });
            console.debug("sign up haha");
            return res.status(201).json({
                id: user.id,
                username: user.username
            });
        }
        catch (e) {
            if (e instanceof Error)
                return res.status(409).json({ error: e.message });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    @Endpoint("POST", "/login")
    @UseMiddlewares(bodyParser.json())
    @UseMiddlewares(bodyParser.urlencoded({ extended: true }))
    public async login(req: express.Request, res: express.Response) {
        const { email, password } = req.body ?? {} as { email: string, password: string };
        if (!email || !password)
            return res.status(400).json({ error: "An 'email' and 'password' field is required." });

        try {
            // Authenticate the user and return a json web token that expires in 1 day
            const jwt = await User.authenticate(email, password);
            res.cookie("userToken", jwt, { httpOnly: true });

            // After the token is set, the user can do other tasks with the cookie, like
            // fetching their stats or deleting their account
            return res.status(200).json({ success: true });
        }
        catch (e) {
            // If there is a lookup error, return a 400 status code - user not found
            if (e instanceof DatabaseError)
                return res.status(400).json({ success: false, error: e.message });

            // If there is an authentication error, return a 401 status code - they aren't authorized
            if (e instanceof UserAuthError)
                return res.status(401).json({ success: false, error: e.message });

            return res.status(500).json({ success: false, error: "Internal server error" });
        }
    }

    @Endpoint("GET", "/stats")
    @UseMiddlewares(UserAuth)
    public async myStats(req: express.Request, res: express.Response) {
        try {
            let selectStats: { [key: string]: boolean } | undefined;
            
            const selectList = req.query.select ? (req.query.select as string).split(",") : undefined;
            if (selectList !== undefined) {
                selectStats = {};
                for (const key of selectList)
                    selectStats[key] = true;
            }

            const user = await prisma.user.findUnique({ 
                where: { id: req.userId },
                select: { stats: { select: selectStats } }
            });
            
            return res.status(200).json(user?.stats);
        }
        catch (e) {
            if (e instanceof Error) {
                return res.status(404).json({ error: e.message });
            }
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    @Endpoint("GET", "/:name/stats")
    public async userStats(req: express.Request, res: express.Response) {
        try {
            let selectStats: { [key: string]: boolean } | undefined;
            
            const selectList = req.query.select ? (req.query.select as string).split(",") : undefined;
            if (selectList !== undefined) {
                selectStats = {};
                for (const key of selectList)
                    selectStats[key] = true;
            }

            const user = await prisma.user.findUnique({ 
                where: { username: req.params.name },
                select: { stats: { select: selectStats } }
            });

            return res.status(200).json(user?.stats);
        }
        catch (e) {
            if (e instanceof Error) {
                return res.status(404).json({ error: e.message });
            }
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    @Endpoint("DELETE", "/")
    @UseMiddlewares(UserAuth)
    public async deleteUser(req: express.Request, res: express.Response) {
        console.log("Logged in:", req.userId!);
        res.end("ok");
    }
}