require("dotenv").config();
const { Client } = require("pg");

async function testDbConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Успешно подключено к PostgreSQL!");

    const res = await client.query("SELECT NOW()");
    console.log("Текущее время в БД:", res.rows[0].now);
  } catch (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
    console.error("DATABASE_URL:", process.env.DATABASE_URL);
  } finally {
    await client.end();
  }
}

testDbConnection();
