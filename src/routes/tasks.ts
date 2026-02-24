import { and, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { Router, Request, Response } from "express";
import { tasks } from "../db/schema/app";
import { db } from "../db";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const { search, title, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(tasks.title, `%${search}%`),
                    ilike(tasks.description, `%${search}%`)
                )
            )
        };

        if (title) {
            filterConditions.push(ilike(tasks.title, `%${title}%`));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(tasks)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;
        const taskList = await db
            .select({ ...getTableColumns(tasks) })
            .from(tasks).where(whereClause)
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: taskList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });
    } catch (err) {
        console.error("Error fetching tasks: ", err);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

export default router;  