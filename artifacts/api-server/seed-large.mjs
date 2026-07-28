import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

async function seedLarge() {
  console.log('Connecting to database for MASSIVE demo seeding...');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log('Connected. Beginning massive data generation...');

  try {
    const passwordHash = await bcrypt.hash('password123', 12);
    
    // 1. Generate Clients
    const clientNames = ['Acme Corporation', 'Global Tech Industries', 'City Center Mall', 'Sunset Residential', 'Apex Logistics'];
    const clientIds = [];
    for (const cName of clientNames) {
      const email = `contact@${cName.replace(/\s+/g, '').toLowerCase()}.com`;
      const res = await client.query(`
        INSERT INTO clients (name, email, phone, address, industry, status)
        VALUES ($1, $2, '+1-555-0100', '100 Business Parkway', 'Mixed', 'active')
        RETURNING id
      `, [cName, email]);
      clientIds.push(res.rows[0].id);
    }
    console.log(`✅ Generated ${clientIds.length} Clients`);

    // 2. Generate Sites
    const siteIds = [];
    for (let i = 0; i < clientIds.length; i++) {
      // 2 sites per client
      for(let j=1; j<=2; j++) {
        const sRes = await client.query(`
          INSERT INTO sites (client_id, name, address, required_guards, status)
          VALUES ($1, 'Site ${j} for Client ${i+1}', '10${j} Main St, City', $2, 'active')
          RETURNING id
        `, [clientIds[i], j+1]);
        siteIds.push(sRes.rows[0].id);
      }
    }
    console.log(`✅ Generated ${siteIds.length} Sites`);

    // 3. Generate Guards & Users
    const guardUserIds = [];
    const guardIds = [];
    const firstNames = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin'];
    
    for (let i = 0; i < 20; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i + 5) % lastNames.length];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@securerp.com`;
      
      const uRes = await client.query(`
        INSERT INTO users (name, email, password_hash, role) 
        VALUES ($1, $2, $3, 'guard')
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `, [`${fn} ${ln}`, email, passwordHash]);
      
      let uId;
      if (uRes.rows.length > 0) {
        uId = uRes.rows[0].id;
      } else {
        const u = await client.query(`SELECT id FROM users WHERE email=$1`, [email]);
        uId = u.rows[0].id;
      }
      guardUserIds.push(uId);

      const siteId = siteIds[i % siteIds.length];
      
      const gRes = await client.query(`
        INSERT INTO guards (user_id, employee_id, status, site_id)
        VALUES ($1, $2, 'active', $3)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [uId, `GRD-${100+i}`, siteId]);
      
      if(gRes.rows.length > 0){
        guardIds.push(gRes.rows[0].id);
      } else {
        const g = await client.query(`SELECT id FROM guards WHERE user_id=$1`, [uId]);
        guardIds.push(g.rows[0].id);
      }
    }
    console.log(`✅ Generated ${guardIds.length} Guards`);

    // 4. Generate Shifts & Attendance
    let shiftsCount = 0;
    let attendanceCount = 0;
    const now = new Date();
    
    for (let g = 0; g < guardIds.length; g++) {
      const gId = guardIds[g];
      const sId = siteIds[g % siteIds.length];
      
      // Generate 5 past shifts and 3 future shifts for each guard
      for (let dayOffset = -5; dayOffset <= 3; dayOffset++) {
        const shiftStart = new Date(now);
        shiftStart.setDate(now.getDate() + dayOffset);
        shiftStart.setHours(9, 0, 0, 0); // 9 AM
        
        const shiftEnd = new Date(shiftStart);
        shiftEnd.setHours(17, 0, 0, 0); // 5 PM
        
        const status = dayOffset < 0 ? 'completed' : (dayOffset === 0 ? 'in_progress' : 'scheduled');
        
        const shRes = await client.query(`
          INSERT INTO shifts (site_id, guard_id, start_time, end_time, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `, [sId, gId, shiftStart.toISOString(), shiftEnd.toISOString(), status]);
        
        shiftsCount++;
        const shiftId = shRes.rows[0].id;
        
        // Add attendance for past and current shifts
        if (dayOffset <= 0) {
          const checkIn = new Date(shiftStart);
          checkIn.setMinutes(checkIn.getMinutes() - Math.floor(Math.random() * 15)); // early by 0-15 mins
          
          let checkOut = null;
          if (dayOffset < 0) {
            checkOut = new Date(shiftEnd);
            checkOut.setMinutes(checkOut.getMinutes() + Math.floor(Math.random() * 15)); // late by 0-15 mins
          }
          
          await client.query(`
            INSERT INTO attendance (shift_id, guard_id, date, check_in, check_out, status)
            VALUES ($1, $2, $3, $4, $5, 'present')
          `, [shiftId, gId, checkIn.toISOString().split('T')[0], checkIn.toISOString(), checkOut ? checkOut.toISOString() : null]);
          attendanceCount++;
        }
      }
    }
    console.log(`✅ Generated ${shiftsCount} Shifts and ${attendanceCount} Attendance Records`);

    // 5. Generate Incidents
    const incidentTypes = ['trespassing', 'vandalism', 'theft', 'medical', 'other'];
    const severities = ['low', 'medium', 'high', 'critical'];
    for(let i=0; i<15; i++) {
      const sId = siteIds[i % siteIds.length];
      const gId = guardIds[i % guardIds.length];
      const incDate = new Date(now);
      incDate.setDate(now.getDate() - Math.floor(Math.random() * 10));
      
      await client.query(`
        INSERT INTO incidents (site_id, guard_id, type, severity, status, description, reported_at)
        VALUES ($1, $2, $3, $4, 'open', 'Suspicious activity reported near the rear entrance.', $5)
      `, [sId, gId, incidentTypes[i%5], severities[i%4], incDate.toISOString()]);
    }
    console.log(`✅ Generated 15 Incidents`);

    // 6. Generate Leave Requests
    for(let i=0; i<8; i++) {
      const gId = guardIds[i];
      const startDate = new Date(now);
      startDate.setDate(now.getDate() + 5 + i);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 2);
      
      await client.query(`
        INSERT INTO leave_requests (guard_id, type, start_date, end_date, status, reason)
        VALUES ($1, 'vacation', $2, $3, 'approved', 'Annual leave')
      `, [gId, startDate.toISOString(), endDate.toISOString()]);
    }
    console.log(`✅ Generated Leave Requests`);
    
    // 7. Generate Invoices
    for(let i=0; i<10; i++) {
      const cId = clientIds[i % clientIds.length];
      const issueDate = new Date(now);
      issueDate.setDate(now.getDate() - 5 - i);
      const dueDate = new Date(issueDate);
      dueDate.setDate(issueDate.getDate() + 30);
      
      await client.query(`
        INSERT INTO invoices (client_id, invoice_number, period, amount, total_amount, status, due_date)
        VALUES ($1, $2, $3, $4, $5, 'paid', $6)
      `, [cId, `INV-2026-${1000+i}`, '2026-07', 5000 + (i*100), 5000 + (i*100), dueDate.toISOString().split('T')[0]]);
    }
    console.log(`✅ Generated Invoices`);

    console.log('🎉 MASSIVE DEMO DATA SUCCESSFULLY SEEDED!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seedLarge();
