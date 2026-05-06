import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
// Delete orphaned rooms (rooms with no participants)
await conn.query('DELETE FROM room_chat WHERE roomId = 1');
await conn.query('DELETE FROM build_rooms WHERE id = 1');
console.log('Cleaned up orphaned room');
await conn.end();
