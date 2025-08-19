import express from "express";
import pool from "./pool.js";
import { rateLimit } from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const port = 3000;

app.use(express.json());
app.use(limiter);

app.use("/allCities", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const results = await client.query("SELECT * FROM cities");
    const resultLoop = results.rows.map((row) => {
      return {
        rank: row.rank,
        crimeIndex: row.crime_index,
        city: row.city,
        population: row.population,
      };
    });

    res.type("json").send(JSON.stringify(resultLoop, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.use("/randomCity", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = "SELECT * FROM cities ORDER BY RANDOM() LIMIT 1";
    const result = await client.query(query);
    const resultLoop = result.rows.map((row) => {
      return {
        rank: row.rank,
        crimeIndex: row.crime_index,
        city: row.city,
        population: row.population,
      };
    });

    res.type("json").send(JSON.stringify(resultLoop, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
