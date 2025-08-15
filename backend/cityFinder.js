import { chromium } from "playwright";
import * as fs from "node:fs/promises";
import client from "./pool.js";

async function checkFile() {
  try {
    await fs.readFile("cities.json", "utf-8");
    console.log("Cities file already created");
  } catch (err) {
    if (err.code == "ENOENT") {
      scrape();
    }
  }
}

await checkFile();

async function scrape() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.route("**/*.{png,jpg,jpeg,gif,svg}", (route) => route.abort());
  await page.route(/.*doubleclick\.net.*/, (route) => route.abort());
  const url =
    "http://www.usa.com/rank/illinois-state--crime-index--city-rank.htm?yr=9000&dis=&wist=&plow=&phigh=";
  await page.goto(url);

  const trElements = await page.locator("tr").all();
  const headRowSlice = trElements.slice(2, 202);
  const cities = [];

  try {
    for (const row of headRowSlice) {
      const cityObj = {};
      const rankText = row.locator("td:nth-child(1)").innerText();
      const rankPeriodRemove = (await rankText).split(".").join("");
      const crimeIndexText = row.locator("td:nth-child(2)").innerText();
      const cityText = row.locator("td").last().innerText();
      const city = (await cityText).split("/")[0];
      const population = (await cityText).split("/")[1];
      const populationCommaSplit = population.split(",").join("");

      cityObj.rank = await rankPeriodRemove;
      cityObj.crimeIndex = await crimeIndexText;
      cityObj.city = await city;
      cityObj.population = await populationCommaSplit;
      cities.push(cityObj);
    }

    await fs.writeFile("cities.json", JSON.stringify(cities, null, 2));
  } catch (err) {
    console.error(err);
  }

  await browser.close();
  await cityInsert();
}

async function cityInsert() {
  try {
    const cityFile = await fs.readFile("cities.json", "utf-8");
    const cities = JSON.parse(cityFile);
    await client.connect();
    console.log("Connected to database");
    for (const { rank, crimeIndex, city, population } of cities) {
      await client.query(
        `INSERT INTO cities (rank, crime_index, city, population) VALUES ($1, $2, $3, $4)
        `,
        [rank, crimeIndex, city, population]
      );
    }

    await client.end();
    console.log("Cities successfully inserted");
  } catch (err) {
    console.error("Error connecting to database", err);
    await client.end();
  }
}
