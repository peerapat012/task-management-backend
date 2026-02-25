import { and, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { tasks } from "../db/schema/app";
import { db } from "../db";
import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getAllTasks = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const { search, title, page = 1, limit = 10 } = req.query;
        const userId = req.user!.id;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions: any[] = [eq(tasks.userId, userId), eq(tasks.isDeleted, false)];

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

        const whereClause = and(...filterConditions);

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
}

export const getTaskById = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const { id } = req.params;
        const taskId = +id!;
        const userId = req.user!.id;

        if (isNaN(taskId)) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        const task = await db
            .select({ ...getTableColumns(tasks) })
            .from(tasks)
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), eq(tasks.isDeleted, false)))
            .limit(1);

        if (task.length === 0) {
            res.status(404).json({ message: "Task not found" });
            return;
        }

        res.status(200).json(task[0]);
    } catch (err) {
        console.error("Error fetching task: ", err);
        res.status(500).json({ message: "Failed to fetch task" });
    }
}

export const createTask = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const { title, description, status, priority } = req.body;
        const userId = req.user!.id;

        if (!title) {
            res.status(400).json({ message: "Title is required" });
            return;
        }

        const [newTask] = await db
            .insert(tasks)
            .values({
                title,
                description,
                status: status || 'pending',
                priority: priority || 'medium',
                userId
            })
            .returning({ ...getTableColumns(tasks) });

        res.status(201).json(newTask);
    } catch (err) {
        console.error("Error creating task: ", err);
        res.status(500).json({ message: "Failed to create task" });
    }
}

export const updateTask = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const { id } = req.params;
        const taskId = +id!;
        const userId = req.user!.id;

        if (isNaN(taskId)) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        const { title, description, status, priority } = req.body;

        const [updatedTask] = await db
            .update(tasks)
            .set({
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(priority && { priority }),
                updatedAt: new Date()
            })
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .returning({ ...getTableColumns(tasks) });

        if (!updatedTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }

        res.status(200).json(updatedTask);
    } catch (err) {
        console.error("Error updating task: ", err);
        res.status(500).json({ message: "Failed to update task" });
    }
}

export const deleteTask = async (req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    try {
        const { id } = req.params;
        const taskId = +id!;
        const userId = req.user!.id;

        if (isNaN(taskId)) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        const [deletedTask] = await db
            .update(tasks)
            .set({ isDeleted: true, updatedAt: new Date() })
            .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
            .returning({ ...getTableColumns(tasks) });

        if (!deletedTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }

        res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
    } catch (err) {
        console.error("Error deleting task: ", err);
        res.status(500).json({ message: "Failed to delete task" });
    }
}