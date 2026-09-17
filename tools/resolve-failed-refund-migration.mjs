import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const migrationName = "20260915020000_add_refund_infrastructure";
const expectedTables = [
  "PaymentIssueClaim",
  "PaymentIssueEvidence",
  "PaymentIssueEvent",
  "PaymentIssueEmailDelivery",
  "SquareRefundAttempt",
];

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for migration recovery.");
}

const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('pin2win-refund-migration-recovery'))",
  );

  const migrationResult = await client.query(
    `SELECT id, migration_name, logs, applied_steps_count
     FROM "_prisma_migrations"
     WHERE migration_name = $1
       AND finished_at IS NULL
       AND rolled_back_at IS NULL
     ORDER BY started_at DESC
     FOR UPDATE`,
    [migrationName],
  );

  if (migrationResult.rowCount === 0) {
    console.log(`No unresolved ${migrationName} record found; no recovery needed.`);
    await client.query("COMMIT");
  } else {
    if (migrationResult.rowCount !== 1) {
      throw new Error(
        `Expected one unresolved ${migrationName} record, found ${migrationResult.rowCount}.`,
      );
    }

    const migration = migrationResult.rows[0];
    const logs = String(migration.logs ?? "");
    const matchesExpectedFailure =
      logs.includes("42701") &&
      logs.includes("refundStatus") &&
      logs.includes("SquareCheckout") &&
      logs.includes("already exists");

    if (!matchesExpectedFailure || Number(migration.applied_steps_count) !== 0) {
      throw new Error(
        `Refusing to resolve ${migrationName}: the stored failure does not match the expected duplicate-column error.`,
      );
    }

    const columnResult = await client.query(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'SquareCheckout'
         AND column_name = 'refundStatus'`,
    );

    if (
      columnResult.rowCount !== 1 ||
      columnResult.rows[0].data_type !== "text"
    ) {
      throw new Error(
        "Refusing recovery: SquareCheckout.refundStatus is not the expected legacy text column.",
      );
    }

    const tableResult = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [expectedTables],
    );

    if (tableResult.rowCount !== 0) {
      throw new Error(
        `Refusing recovery: the failed migration appears partially applied (${tableResult.rows
          .map((row) => row.table_name)
          .join(", ")}).`,
      );
    }

    const updateResult = await client.query(
      `UPDATE "_prisma_migrations"
       SET rolled_back_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND finished_at IS NULL
         AND rolled_back_at IS NULL
       RETURNING migration_name`,
      [migration.id],
    );

    if (updateResult.rowCount !== 1) {
      throw new Error(`Failed to resolve ${migrationName} safely.`);
    }

    await client.query("COMMIT");
    console.log(
      `Marked the expected failed ${migrationName} attempt as rolled back.`,
    );
  }
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Preserve the original recovery error.
  }

  throw error;
} finally {
  await client.end();
}
