const pool = require('../db');
const bcrypt = require('bcrypt');

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seed...');
    
    // 1. Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(`
      INSERT INTO users (username, email, phone, password_hash, role, full_name, is_active)
      VALUES ('admin', 'admin@kosana.id', '081234567890', $1, 'admin', 'Administrator', true)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, [hashedPassword]);
    
    const adminId = adminResult.rows[0]?.id;
    if (adminId) {
      console.log(`✓ Admin user created with ID: ${adminId}`);
    } else {
      console.log('✓ Admin user already exists');
    }
    
    // Get admin ID if already exists
    const adminCheck = await client.query("SELECT id FROM users WHERE username = 'admin'");
    const existingAdminId = adminCheck.rows[0]?.id;
    
    // 2. Create sample properties
    console.log('Creating sample properties...');
    const properties = [
      {
        name: 'Kos Kebayoran Lama',
        address: 'Jl. Kebayoran Lama No. 45, Jakarta Selatan',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Lama',
        postal_code: '12210',
        contact_phone: '081234567890',
        property_type: 'male',
        amenities: { wifi: true, ac: true, hotWater: true, parking: true, cctv: true },
        rules: 'Dilarang merokok di kamar. Jam malam 22:00. Tamu harus lapor.'
      },
      {
        name: 'Kos Harmoni',
        address: 'Jl. Harmoni Raya No. 12, Jakarta Pusat',
        city: 'Jakarta Pusat',
        district: 'Harmoni',
        postal_code: '10110',
        contact_phone: '081234567891',
        property_type: 'female',
        amenities: { wifi: true, ac: true, hotWater: true, parking: true, cctv: true },
        rules: 'Dilarang membawa tamu laki-laki. Jam malam 21:00.'
      }
    ];
    
    const propertyIds = [];
    for (const prop of properties) {
      const result = await client.query(`
        INSERT INTO properties (
          name, address, city, district, postal_code, contact_phone,
          property_manager_id, property_type, total_floors, total_rooms, amenities, rules, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        prop.name, prop.address, prop.city, prop.district, prop.postal_code,
        prop.contact_phone, existingAdminId, prop.property_type, 3, 30,
        JSON.stringify(prop.amenities), prop.rules
      ]);
      
      if (result.rows[0]?.id) {
        propertyIds.push(result.rows[0].id);
        console.log(`✓ Property created: ${prop.name}`);
      }
    }
    
    // Get existing property IDs if they already exist
    const existingProps = await client.query("SELECT id, name FROM properties");
    const allPropertyIds = existingProps.rows.map(r => r.id);
    
    // 3. Create sample rooms for first property
    if (allPropertyIds.length > 0) {
      console.log('Creating sample rooms...');
      const propertyId = allPropertyIds[0];
      
      const rooms = [
        { number: '101', floor: 1, type: 'standard', rent: 2000000, status: 'occupied' },
        { number: '102', floor: 1, type: 'deluxe', rent: 2500000, status: 'occupied' },
        { number: '103', floor: 1, type: 'standard', rent: 1800000, status: 'available' },
        { number: '104', floor: 1, type: 'premium', rent: 3000000, status: 'occupied' },
        { number: '105', floor: 1, type: 'standard', rent: 1800000, status: 'maintenance' },
        { number: '201', floor: 2, type: 'standard', rent: 1900000, status: 'occupied' },
        { number: '202', floor: 2, type: 'deluxe', rent: 2400000, status: 'occupied' },
        { number: '203', floor: 2, type: 'standard', rent: 1900000, status: 'available' }
      ];
      
      const roomIds = [];
      for (const room of rooms) {
        const result = await client.query(`
          INSERT INTO rooms (
            property_id, room_number, floor, room_type, size_sqm,
            occupancy_type, base_monthly_rent, amenities, status, ac_unit_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (property_id, room_number) DO NOTHING
          RETURNING id
        `, [
          propertyId, room.number, room.floor, room.type, 12,
          'single', room.rent, JSON.stringify({ ac: true, privateBathroom: true, wifi: true }),
          room.status, `AC-${room.number}`
        ]);
        
        if (result.rows[0]?.id) {
          roomIds.push({ id: result.rows[0].id, ...room });
        }
      }
      
      console.log(`✓ Created ${roomIds.length} rooms`);
      
      // 4. Create sample tenants for occupied rooms
      console.log('Creating sample tenants...');
      const occupiedRooms = roomIds.filter(r => r.status === 'occupied');
      
      const tenantNames = [
        { name: 'Ahmad Fauzi', phone: '081234567801' },
        { name: 'Citra Dewi', phone: '081234567803' },
        { name: 'Dedi Pratama', phone: '081234567805' },
        { name: 'Eka Wijaya', phone: '081234567807' },
        { name: 'Budi Santoso', phone: '081234567809' }
      ];
      
      for (let i = 0; i < Math.min(occupiedRooms.length, tenantNames.length); i++) {
        const room = occupiedRooms[i];
        const tenant = tenantNames[i];
        
        await client.query(`
          INSERT INTO tenants (
            property_id, room_id, full_name, phone, email,
            emergency_contact, emergency_phone, ktp_number, ktp_image_url,
            check_in_date, contract_duration_months, base_monthly_rent,
            total_monthly_rent, security_deposit, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active')
          ON CONFLICT DO NOTHING
        `, [
          propertyId, room.id, tenant.name, tenant.phone, `${tenant.name.toLowerCase().replace(' ', '.')}@email.com`,
          'Emergency Contact', '081234567800', `317101234567890${i+1}`, 'https://example.com/ktp.jpg',
          '2025-01-01', 12, room.rent, room.rent, room.rent
        ]);
      }
      
      console.log(`✓ Created ${Math.min(occupiedRooms.length, tenantNames.length)} tenants`);
    }
    
    // 5. Create system settings
    console.log('Creating system settings...');
    const settings = [
      { key: 'businessName', value: 'Kos Ana Management', type: 'string' },
      { key: 'businessEmail', value: 'admin@kosana.id', type: 'string' },
      { key: 'businessPhone', value: '081234567890', type: 'string' },
      { key: 'currency', value: 'IDR', type: 'string' },
      { key: 'lateFeePercentage', value: '5', type: 'number' },
      { key: 'gracePeriod', value: '3', type: 'number' }
    ];
    
    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (setting_key) DO NOTHING
      `, [setting.key, setting.value, setting.type, existingAdminId]);
    }
    
    console.log(`✓ Created ${settings.length} system settings`);
    
    await client.query('COMMIT');
    console.log('\n✅ Database seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed().catch(console.error);