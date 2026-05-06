import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await conn.query('DESCRIBE agents');
  console.log('agents table columns:', rows.map(r => r.Field).join(', '));
} catch(e) {
  console.error('agents table Error:', e.message);
}
try {
  const [rows] = await conn.query('SELECT * FROM room_participants WHERE roomId = 1');
  console.log('room_participants:', JSON.stringify(rows));
} catch(e) {
  console.error('room_participants Error:', e.message);
}
try {
  const [rows] = await conn.query('SELECT rp.id, rp.agentId, a.id as agent_id FROM room_participants rp LEFT JOIN agents a ON rp.agentId = a.id WHERE rp.roomId = 1');
  console.log('LEFT JOIN test:', JSON.stringify(rows));
} catch(e) {
  console.error('LEFT JOIN Error:', e.message);
}
await conn.end();
