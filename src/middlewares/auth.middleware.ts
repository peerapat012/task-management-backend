import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/app";

export interface AuthRequest extends Request {
    user?: typeof users.$inferSelect;
}

const authorize = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        let token;

        if (req.header("Authorization") && req.header("Authorization")?.startsWith("Bearer")) {
            token = req.header("Authorization")?.split(" ")[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            res.status(401).json({ message: "Unauthorized", error: "No token provided" });
            return;
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
        const [user] = await db.select().from(users).where(eq(users.id, decodedToken.id)).limit(1);

        if (!user) {
            res.status(401).json({ message: "Unauthorized", error: "User not found" });
            return;
        }

        req.user = user;
        next();
    } catch (err: any) {
        console.error("Error authorizing user: ", err);
        res.status(401).json({ message: "Unauthorized", error: err.message });
    }
}

export default authorize;