import pg from 'pg';
const { Client } = pg;

async function resetDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log('Connected to DB. Dropping all tables...');

  try {
    const res = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);

    for (const row of res.rows) {
      console.log(`Dropping table ${row.tablename}...`);
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE;`);
    }

    console.log('All tables dropped successfully.');
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await client.end();
  }
}

resetDb();
