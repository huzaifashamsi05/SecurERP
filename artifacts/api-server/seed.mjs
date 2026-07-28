import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

async function seed() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log('Connected.');

  try {
    // 1. Create Users
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('password123', 12);
    
    // Create Manager
    const managerRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Admin Manager', 'admin@securerp.com', $1, 'operations_manager')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [passwordHash]);
    
    // Create HR
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('HR Director', 'hr@securerp.com', $1, 'hr_manager')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

    // Create Guard
    const guardUserRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('John Security', 'john@securerp.com', $1, 'guard')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [passwordHash]);

    // Create Client User
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Acme Corp Admin', 'admin@acmecorp.com', $1, 'client')
      ON CONFLICT (email) DO NOTHING
    `, [passwordHash]);

    // 2. Create Client
    console.log('Creating client...');
    const clientRes = await client.query(`
      INSERT INTO clients (name, email, phone, address, industry, status)
      VALUES ('Acme Corporation', 'contact@acmecorp.com', '+1-555-0199', '123 Business Blvd, Tech City', 'Technology', 'active')
      RETURNING id
    `);
    
    let clientId;
    if (clientRes.rows.length > 0) {
      clientId = clientRes.rows[0].id;
    } else {
      const c = await client.query(`SELECT id FROM clients WHERE email='contact@acmecorp.com'`);
      clientId = c.rows[0].id;
    }

    // 3. Create Site
    console.log('Creating site...');
    let siteId;
    try {
      const siteRes = await client.query(`
        INSERT INTO sites (client_id, name, address, required_guards, status)
        VALUES ($1, 'HQ Building', '123 Business Blvd, Tech City', 2, 'active')
        RETURNING id
      `, [clientId]);
      siteId = siteRes.rows[0].id;
    } catch(e) {
      const s = await client.query(`SELECT id FROM sites WHERE name='HQ Building'`);
      siteId = s.rows[0].id;
    }

    // 4. Create Guard Profile
    console.log('Creating guard profile...');
    if (guardUserRes.rows.length > 0) {
      await client.query(`
        INSERT INTO guards (user_id, employee_id, status, site_id)
        VALUES ($1, 'GRD-001', 'active', $2)
      `, [guardUserRes.rows[0].id, siteId]);
    } else {
      // Find existing guard user id if it was already created
      const gUser = await client.query(`SELECT id FROM users WHERE email = 'john@securerp.com'`);
      if (gUser.rows.length > 0) {
        // Just try inserting, ignore error if already exists
        await client.query(`
          INSERT INTO guards (user_id, employee_id, status, site_id)
          VALUES ($1, 'GRD-001', 'active', $2)
          ON CONFLICT DO NOTHING
        `, [gUser.rows[0].id, siteId]).catch(()=>null);
      }
    }

    // 5. Create a Shift
    console.log('Creating a shift...');
    const now = new Date();
    const end = new Date();
    end.setHours(end.getHours() + 8);
    
    const guardRes = await client.query(`SELECT id FROM guards LIMIT 1`);
    if (guardRes.rows.length > 0) {
      await client.query(`
        INSERT INTO shifts (site_id, guard_id, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, 'scheduled')
      `, [siteId, guardRes.rows[0].id, now.toISOString(), end.toISOString()]);
    }

    console.log('Demo data successfully inserted!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seed();
