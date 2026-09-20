import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function setup() {
  console.log('🌱 Running database seed...');
  await execAsync('npx prisma db seed');
}

export async function teardown() {
  // Optional cleanup after tests
}