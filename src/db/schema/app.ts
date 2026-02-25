import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const statusEnum = pgEnum('status', ['pending', 'in_progress', 'completed']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);
export const usersRoleEnum = pgEnum('role', ['user', 'admin']);

export const users = pgTable('users', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    token: text('token').notNull().unique(),
    role: usersRoleEnum('role').notNull().default('user'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const tasks = pgTable('tasks', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: statusEnum('status').notNull().default('pending'),
    priority: priorityEnum('priority').notNull().default('low'),
    isDeleted: boolean('is_deleted').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
    user: one(users, {
        fields: [tasks.userId],
        references: [users.id],
    }),
}));