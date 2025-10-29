import express from "express";
import path from "path";
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
const host = "0.0.0.0"; 

app.use(express.json());
app.use(express.static(path.join("public")));
app.use(limiter);
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = "SELECT * FROM cities ORDER BY RANDOM() LIMIT 1";
    const result = await client.query(query);
    const resultLoop = await result.rows.map((row) => {
      return {
        rank: row.rank,
        crimeIndex: row.crime_index,
        city: row.city,
        population: row.population,
      };
    });

    res.render("index", { cityInfo: resultLoop[0] });
  } catch (err) {
    console.error(err);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.listen(port, host, () => {
  console.log(`App listening on port ${port}`);
});
