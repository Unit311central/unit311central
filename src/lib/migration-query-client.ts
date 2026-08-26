import type { ClientBase } from "pg";

import { withResolvedDatabaseClient } from "@/lib/internal-db-migrations";
import type { MigrationQueryClient } from "@/lib/migration-ledger";
import { UNIT311_CENTRAL_PROJECT_REF } from "@/lib/unit311-pending-migrations";

export type MigrationQueryBackend = "postgres" | "management-api";

export class MigrationQueryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "MigrationQueryError";
  }
}

export function escapeSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function bindSqlParams(sql: string, params?: unknown[]): string {
  if (!params?.length) return sql;
  return params.reduce<string>(
    (bound, param, index) =>
      bound.replace(new RegExp(`\\$${index + 1}(?!\\d)`, "g"), escapeSqlLiteral(param)),
    sql,
  );
}

function createPgMigrationQueryClient(client: ClientBase): MigrationQueryClient {
  return {
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ): Promise<{ rows: T[] }> {
      const result = await client.query(sql, params);
      return { rows: result.rows as T[] };
    },
  };
}

const RETRYABLE_MANAGEMENT_API_STATUSES = new Set([429, 502, 503, 504]);
const MANAGEMENT_API_MAX_ATTEMPTS = 6;
const MANAGEMENT_API_BASE_DELAY_MS = 2_000;
const MANAGEMENT_API_MAX_DELAY_MS = 30_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function managementApiRetryDelayMs(attempt: number): number {
  return Math.min(MANAGEMENT_API_MAX_DELAY_MS, MANAGEMENT_API_BASE_DELAY_MS * 2 ** (attempt - 1));
}

export function createManagementApiMigrationQueryClient(options: {
  token: string;
  projectRef?: string;
}): MigrationQueryClient {
  const projectRef = options.projectRef ?? UNIT311_CENTRAL_PROJECT_REF;

  return {
    async query<T extends Record<string, unknown> = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ): Promise<{ rows: T[] }> {
      const query = bindSqlParams(sql, params);
      let lastError: MigrationQueryError | null = null;

      for (let attempt = 1; attempt <= MANAGEMENT_API_MAX_ATTEMPTS; attempt++) {
        const response = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${options.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
          },
        );

        const data = (await response.json()) as Array<T> | { message?: string };
        if (response.ok) {
          if (!Array.isArray(data)) {
            throw new MigrationQueryError(
              "Management API query returned a non-array response.",
              response.status,
              data,
            );
          }

          return { rows: data };
        }

        const message =
          typeof data === "object" && data !== null && "message" in data
            ? String(data.message)
            : JSON.stringify(data).slice(0, 500);
        lastError = new MigrationQueryError(
          `Management API query failed (${response.status}): ${message}`,
          response.status,
          data,
        );

        if (
          RETRYABLE_MANAGEMENT_API_STATUSES.has(response.status) &&
          attempt < MANAGEMENT_API_MAX_ATTEMPTS
        ) {
          await sleep(managementApiRetryDelayMs(attempt));
          continue;
        }

        throw lastError;
      }

      throw lastError ?? new MigrationQueryError("Management API query failed after retries.");
    },
  };
}

export async function withMigrationQueryClient<T>(
  operation: (client: MigrationQueryClient) => Promise<T>,
): Promise<{ backend: MigrationQueryBackend; result: T } | null> {
  const pgResult = await withResolvedDatabaseClient(async (client) =>
    operation(createPgMigrationQueryClient(client)),
  );
  if (pgResult !== null) {
    return { backend: "postgres", result: pgResult };
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
  if (token.length >= 20) {
    const result = await operation(
      createManagementApiMigrationQueryClient({ token, projectRef: UNIT311_CENTRAL_PROJECT_REF }),
    );
    return { backend: "management-api", result };
  }

  return null;
}
