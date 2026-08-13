import pool from './pool'

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create a demo restaurant user + org
    const u1 = await client.query(
      `INSERT INTO users (email, password_hash, role, name, phone, is_verified) VALUES ($1,$2,'restaurant',$3,$4,true) RETURNING id`,
      ['demo@restaurant.local', 'demo', 'Demo Restaurant', '+911234567890']
    )
    const org1 = await client.query(
      `INSERT INTO organisations (user_id, name, org_type, address, city, lat, lng, is_verified) VALUES ($1,$2,'restaurant',$3,$4,$5,$6,true) RETURNING id`,
      [u1.rows[0].id, 'Demo Diner', '1 Main St', 'DemoCity', 12.9716, 77.5946]
    )

    // Create a demo NGO user + org
    const u2 = await client.query(
      `INSERT INTO users (email, password_hash, role, name, phone, is_verified) VALUES ($1,$2,'ngo',$3,$4,true) RETURNING id`,
      ['ngo@demo.local', 'demo', 'Hope Shelter', '+911112223334']
    )
    const org2 = await client.query(
      `INSERT INTO organisations (user_id, name, org_type, address, city, lat, lng, capacity, is_verified) VALUES ($1,$2,'ngo',$3,$4,$5,$6,200,true) RETURNING id`,
      [u2.rows[0].id, 'Hope Shelter', '10 Shelter Rd', 'DemoCity', 12.9720, 77.5950]
    )

    // Create volunteers
    const v1u = await client.query(`INSERT INTO users (email, password_hash, role, name, phone, is_verified) VALUES ($1,$2,'volunteer',$3,$4,true) RETURNING id`, ['v1@demo.local','demo','Priya','+919900112233'])
    const v1 = await client.query(`INSERT INTO volunteer_profiles (user_id, vehicle, vehicle_details, rating, is_available, last_location_lat, last_location_lng) VALUES ($1,'scooter','Honda Activa',4.9,true, $2,$3) RETURNING id`, [v1u.rows[0].id,12.9725,77.5948])

    const v2u = await client.query(`INSERT INTO users (email, password_hash, role, name, phone, is_verified) VALUES ($1,$2,'volunteer',$3,$4,true) RETURNING id`, ['v2@demo.local','demo','Rahul','+919988776655'])
    const v2 = await client.query(`INSERT INTO volunteer_profiles (user_id, vehicle, vehicle_details, rating, is_available, last_location_lat, last_location_lng) VALUES ($1,'bicycle','Giant',4.6,true,$2,$3) RETURNING id`, [v2u.rows[0].id,12.9705,77.5935])

    // Create a demo listing
    const listing = await client.query(
      `INSERT INTO listings (donor_id, name, food_type, quantity, unit, storage, notes, pickup_deadline, pickup_lat, pickup_lng, pickup_address, spoilage_risk, ai_confidence)
       VALUES ($1,$2,'cooked_meals',20,'kg','refrigerated','Freshly made meals', NOW() + INTERVAL '3 hours', $3, $4, $5, 35, 0.8) RETURNING id`,
      [org1.rows[0].id, 'Fresh Meals Batch', 12.9718, 77.5949, '1 Main St, DemoCity']
    )

    await client.query('COMMIT')
    console.log('Seed complete')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed', err)
    process.exit(1)
  } finally {
    client.release()
    process.exit(0)
  }
}

seed()
