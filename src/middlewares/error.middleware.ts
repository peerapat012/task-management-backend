import { Request, Response, NextFunction } from "express";

// ─── PostgreSQL CRUD Error Codes ──────────────────────────────────────────────
// Only codes that can realistically surface during INSERT / SELECT / UPDATE / DELETE
// Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html

const PG_CRUD_ERROR_CODES: Record<string, { status: number; message: string }> = {

    // ── Class 08: Connection Exception ──────────────────────────────────────────
    // Triggered when the DB connection drops mid-request
    "08000": { status: 503, message: "Database connection error." },
    "08006": { status: 503, message: "Database connection failure." },

    // ── Class 22: Bad Input Data ──────────────────────────────────────────────
    // Triggered by INSERT / UPDATE with malformed or out-of-range values
    "22001": { status: 400, message: "Value too long for column." },
    "22003": { status: 400, message: "Numeric value out of range." },
    "22007": { status: 400, message: "Invalid date/time format." },
    "22P02": { status: 400, message: "Invalid input value for the target data type." },

    // ── Class 23: Integrity Constraint Violation ───────────────────────────────
    // The most common CRUD errors — constraint failures on INSERT / UPDATE / DELETE
    "23502": { status: 400, message: "A required field is missing (not-null constraint)." },
    "23503": { status: 409, message: "Referenced record does not exist (foreign key constraint)." },
    "23505": { status: 409, message: "A record with this value already exists (unique constraint)." },
    "23514": { status: 400, message: "Value does not satisfy the column check constraint." },

    // ── Class 40: Transaction Rollback ────────────────────────────────────────
    // Can happen on concurrent writes (UPDATE / DELETE)
    "40001": { status: 503, message: "Transaction conflict — please retry the operation." },
    "40P01": { status: 409, message: "Deadlock detected — please retry the operation." },

    // ── Class 57: Query Timeout / Cancellation ────────────────────────────────
    // Triggered when a SELECT / UPDATE / DELETE takes too long
    "57014": { status: 408, message: "The request timed out. Please try again." },
};

// ─── PostgreSQL Error Interface ───────────────────────────────────────────────

interface PostgresError extends Error {
    code?: string;
    detail?: string;
    hint?: string;
    column?: string;
    constraint?: string;
    table?: string;
}

// ─── App Error Class ──────────────────────────────────────────────────────────

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

// ─── Helper: Is PostgreSQL Error ─────────────────────────────────────────────

function isPostgresError(err: unknown): err is PostgresError {
    return (
        err instanceof Error &&
        "code" in err &&
        typeof (err as PostgresError).code === "string"
    );
}

// ─── Error Middleware ─────────────────────────────────────────────────────────

export const errorMiddleware = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const isDev = process.env.NODE_ENV === "development";

    // ── 1. Known application errors (thrown with AppError) ─────────────────────
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            status: err.statusCode,
            message: err.message,
            ...(isDev && { stack: err.stack }),
        });
        return;
    }

    // ── 2. PostgreSQL / Drizzle ORM errors ─────────────────────────────────────
    if (isPostgresError(err)) {
        const pgCode = err.code ?? "";
        const mapped = PG_CRUD_ERROR_CODES[pgCode];

        if (mapped) {
            res.status(mapped.status).json({
                success: false,
                status: mapped.status,
                message: mapped.message,
                ...(isDev && {
                    pgCode,
                    detail: err.detail,
                    hint: err.hint,
                    constraint: err.constraint,
                    column: err.column,
                    table: err.table,
                    stack: err.stack,
                }),
            });
            return;
        }

        // Unmapped PG code — log it so we can add it later if needed
        console.error(`[DB] Unmapped PostgreSQL error (${pgCode}):`, err.message);
        res.status(500).json({
            success: false,
            status: 500,
            message: "An unexpected database error occurred.",
            ...(isDev && { pgCode, detail: err.detail, stack: err.stack }),
        });
        return;
    }

    // ── 3. Generic / unknown errors ────────────────────────────────────────────
    const genericError = err instanceof Error ? err : new Error(String(err));
    console.error("[Error]", genericError.message);

    res.status(500).json({
        success: false,
        status: 500,
        message: "Internal server error.",
        ...(isDev && { stack: genericError.stack }),
    });
};