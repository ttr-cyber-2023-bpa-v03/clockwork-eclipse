import express from "express";

import { Route } from "@logic/server/route";
import { Endpoint } from "@logic/server/endpoint";
import { UseMiddlewares } from "@logic/server/handler";

import prisma from "@logic/prisma";
import { User, IUser } from "@models/user";

import bodyParser from "body-parser";
import UserAuth from "@middlewares/userAuth";

@Route("/api/users")
export default class UsersRoute {
    @Endpoint("GET", "/")
    public async root(req: express.Request, res: express.Response) {
        res.status(200).json({ status: "OK" });
    }

    // TODO: Captcha is probably a good idea here
    @Endpoint("POST", "/signup")
    @UseMiddlewares(bodyParser.json())
    public async signup(req: express.Request, res: express.Response) {
        const { email, password, username } = req.body ?? {} as { 
            email: string,
            password: string,
            username: string
        };

        if (!email || !password || !username)
            return res.status(400).json({ error: "Fields 'email', 'password', and 'username' are required" });

        try {
            const user = await User.create({ email, password, username });
            return res.status(201).json({
                id: user.id,
                name: user.username
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
    public async login(req: express.Request, res: express.Response) {
        const { email, password } = req.body ?? {} as { email: string, password: string };
        if (!email || !password)
            return res.status(400).json({ error: "Fields 'email' and 'password' are required" });

        try {
            const jwt = await User.authenticate(email, password);
            res.cookie("authorization", `Bearer ${jwt}`);
            return res.status(200).json({ success: true });
        }
        catch (e) {
            if (e instanceof Error)
                return res.status(404).json({ error: e.message });
            return res.status(500).json({ error: "Internal server error" });
        }
    }

    @Endpoint("GET", "/:name/stats")
    public async getUser(req: express.Request, res: express.Response) {
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
                select: { stats: {
                    select: selectStats
                } }
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
    public async deleteLoggedInUser(req: express.Request, res: express.Response) {
        console.log("Logged in:", req.userId!);
        res.end("ok");
    }

    @Endpoint("DELETE", "/:id")
    @UseMiddlewares(UserAuth)
    public async deleteUser(req: express.Request, res: express.Response) {
        console.log("User ID:", req.params.id);
        console.log("Logged in:", req.userId!);
        res.end("ok");
    }
}