const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();
