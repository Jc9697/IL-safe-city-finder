import pg from "pg";
const { Client } = pg;

const client = new Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.database,
  password: process.env.password,
  port: process.env.port,
});

export default client;
