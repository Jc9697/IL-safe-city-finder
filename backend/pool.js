import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pg;

const client = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

export default client;
