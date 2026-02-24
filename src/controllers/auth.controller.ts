import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/schema.js";
import { AppError } from "../middlewares/error.middleware.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? "7d";
const SALT_ROUNDS = 12;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined.");
}

/** Sign a JWT and return the token string. */
function signToken(payload: { id: number; email: string; role: string }): string {
    const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] };
    return jwt.sign(payload, JWT_SECRET as string, opts);
}

/** Attach the token as a secure HttpOnly cookie on the response. */
function attachCookie(res: Response, token: string): void {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const days = parseInt(JWT_EXPIRES_IN as string, 10) || 7;
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: days * MS_PER_DAY,
    });
}

const emailValidate: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name, email, password } = req.body as {
            name?: string;
            email?: string;
            password?: string;
        };

        if (!name || !email || !password) {
            throw new AppError("name, email, and password are required.", 400);
        }

        if (!email.match(emailValidate)) {
            throw new AppError("Invalid email format.", 400);
        }

        if (password.length < 6) {
            throw new AppError("Password must be at least 6 characters.", 400);
        }

        const [existing] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existing) {
            throw new AppError("An account with that email already exists.", 409);
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const tempToken = "pending";

        const result = await db
            .insert(users)
            .values({
                name,
                email,
                password: hashedPassword,
                token: tempToken,
            })
            .returning();

        const newUser = result[0];
        if (!newUser) {
            throw new AppError("Failed to create user.", 500);
        }

        const token = signToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
        });

        await db.update(users).set({ token }).where(eq(users.id, newUser.id));

        attachCookie(res, token);

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            data: newUser,
        });
    } catch (err) {
        next(err);
    }
};


export const signin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body as {
            email?: string;
            password?: string;
        };

        if (!email || !password) {
            throw new AppError("email and password are required.", 400);
        }

        if (!email.match(emailValidate)) {
            throw new AppError("Invalid email format.", 400);
        }

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            throw new AppError("Invalid email or password.", 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid email or password.", 401);
        }

        const token = signToken({ id: user.id, email: user.email, role: user.role });

        await db.update(users).set({ token }).where(eq(users.id, user.id));

        attachCookie(res, token);

        res.status(200).json({
            success: true,
            message: "Signed in successfully.",
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

export const signout = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies?.token as string | undefined;

        if (token) {
            const decoded = jwt.decode(token) as { id?: number } | null;

            if (decoded?.id) {
                await db
                    .update(users)
                    .set({ token: "invalidated" })
                    .where(eq(users.id, decoded.id));
            }
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "Signed out successfully.",
        });
    } catch (err) {
        next(err);
    }
};