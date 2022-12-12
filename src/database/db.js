import pkg from "pg";
import dotevn from "dotenv";
dotevn.config();

const { Pool } = pkg;

export const connectionDB = new Pool({
    connectionString: process.env.DATABASE_URL,
})