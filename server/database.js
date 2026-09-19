const { Pool } = require("pg");
require("dotenv").config();

// Supabase (y la mayoría de los Postgres en la nube) exigen
// SSL en conexiones externas. Sin esto, en Render la conexión
// suele fallar (ECONNRESET / "no encryption" / cuelgues raros).
// En localhost no hace falta.
const esLocal =
    !process.env.DB_HOST ||
    process.env.DB_HOST.includes("localhost") ||
    process.env.DB_HOST.includes("127.0.0.1");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: esLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;