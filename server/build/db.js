import pg from 'pg';
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL ??
    'postgresql://petpro:petpro@localhost:5433/petpro_dev';
export const pool = new Pool({
    connectionString,
});
