export async function register() {
  if (process.env.VERCEL_ENV !== "production") return;

  const { ensureSalesManagementFoundationTables } = await import("@/lib/internal-db-migrations");
  void ensureSalesManagementFoundationTables().catch((error) => {
    console.warn(
      "[sales-management] production foundation ensure failed",
      error instanceof Error ? error.message : error,
    );
  });
}
