require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'photo_restore_pro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🎉 Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    console.error('Please make sure MySQL is running and the database "photo_restore_pro" exists');
    process.exit(1);
  }
}

module.exports = {
  pool,
  testConnection
};
