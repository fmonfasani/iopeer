const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) { console.error("Missing DATABASE_URL"); process.exit(1); }

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    const r = await client.query("select now() as now, current_database() as db");
    console.log("✅ Connected:", r.rows[0]);
  } catch (e) {
    console.error("❌ DB error:", e.message);
  } finally {
    await client.end();
  }
})();
