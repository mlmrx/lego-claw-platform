import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rooms] = await conn.query('SELECT id, publicId, name, status FROM build_rooms');
console.log('build_rooms:', JSON.stringify(rooms, null, 2));
const [parts] = await conn.query('SELECT * FROM room_participants');
console.log('room_participants:', JSON.stringify(parts, null, 2));
await conn.end();
