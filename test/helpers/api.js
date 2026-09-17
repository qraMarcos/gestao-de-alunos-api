import 'dotenv/config';
import request from 'supertest';

export function api() {
  return request(process.env.BASE_URL || 'http://localhost:3000');
}
