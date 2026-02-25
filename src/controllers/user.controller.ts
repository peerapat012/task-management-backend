import { eq, getTableColumns } from "drizzle-orm";
import { users } from "../db/schema/app";
import { db } from "../db";
import { NextFunction, Request, Response } from "express";

export const getAllUsers = async (req: Request,
    res: Response,
    next: NextFunction) => {
    try {
        const userList = await db
            .select({ ...getTableColumns(users) })
            .from(users);

        res.status(200).json(userList);
    } catch (err) {
        console.error("Error fetching users: ", err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
}

export const getUserById = async (req: Request,
    res: Response,
    next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = +id!;

        if (isNaN(userId)) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        const user = await db
            .select({ ...getTableColumns(users) })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (user.length === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json(user[0]);
    } catch (err) {
        console.error("Error fetching user: ", err);
        res.status(500).json({ message: "Failed to fetch user" });
    }
}
