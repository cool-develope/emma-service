import { Pool } from 'pg'

const host = process.env.POSTGRES_HOST || "127.0.0.1"
const dbname = process.env.POSTGRES_DBNAME || "emma"
const port = process.env.POSTGRES_PORT || 5430
const password = process.env.POSTGRES_PASSWORD || "postgres"
const username = process.env.POSTGRES_USERNAME || "postgres"

export default new Pool({
  max: 200,
  connectionString: `postgres://${username}:${password}@${host}:${port}/${dbname}`,
  idleTimeoutMillis: 30000,
})
