import { PoolClient } from 'pg'
import pool from '../dbconfig/dbconnector'

export class ConsumerController {
    public getParallel = async (req, response) => {
        try {
            const userID = req.params.user_id
            const startDate = req.query.start_date
            const endDate = req.query.end_date
            const clients: PoolClient[] = []
            
            for (let i = 0; i < parseInt(process.env.BATCH_COUNT); i++) {
                const client = await pool.connect()
                clients.push(client)
            }

            console.time('Parallel Query Execution')

            const getMerchantsQuery = `SELECT DISTINCT(merchant_id)
                    FROM transactions
                    WHERE user_id = ${userID} AND date >= '${startDate}'::DATE AND date <= '${endDate}'::DATE
                    ORDER BY merchant_id
                ;`

            const getUserCountQuery = `SELECT COUNT (*) as count FROM users`
            
            const sqlResults = await Promise.all([
                clients[0].query(getMerchantsQuery),
                clients[1].query(getUserCountQuery)
            ])

            const merchant_ids = sqlResults[0].rows.map(row => row.merchant_id)
            const userCount = sqlResults[1].rows[0]['count']

            const res = []
            const batch_count = Math.ceil(merchant_ids.length / parseInt(process.env.BATCH_COUNT))
            const tasks = []

            let clientId = 0;
            for (let i = 0; i < merchant_ids.length; i += batch_count) {
                const st = i
                const en = Math.min(i + batch_count, merchant_ids.length)
                
                const unitQuery = `WITH temp as (
                        SELECT SUM(amount) AS amount, merchant_id, user_id
                        FROM transactions
                        WHERE date >= '${startDate}'::DATE AND date <= '${endDate}'::DATE AND merchant_id IN (${merchant_ids.slice(st, en)})
                        GROUP BY merchant_id, user_id
                    ), spends AS (
                        SELECT merchant_id, amount FROM temp WHERE user_id = ${userID}
                    ), result AS (
                        SELECT  spends.merchant_id, spends.amount, SUM(CASE WHEN temp.amount >= spends.amount THEN 1 ELSE 0 END) AS rank
                        FROM temp
                        INNER JOIN spends USING (merchant_id)
                        GROUP BY spends.merchant_id, spends.amount
                        ORDER BY spends.merchant_id
                    ), user_info AS (
                        SELECT count(*) AS count FROM users
                    )
                    SELECT m.display_name, m.icon_url, m.funny_gif_url, 
                    r.amount AS amount, 
                    100.0 * (user_info.count - r.rank) / user_info.count AS ranking
                    FROM merchants AS m
                    INNER JOIN result AS r ON (r.merchant_id = m.id)
                    CROSS JOIN user_info
                    ORDER BY m.id
                ;`
                tasks.push(clients[clientId].query(unitQuery))
                clientId += 1
            }
            const batch_res = await Promise.all(tasks)
            batch_res.map(unit_res => {
                res.push(...unit_res.rows)
            })

            console.timeEnd('Parallel Query Execution')

            for (let i = 0; i < 10; i++) clients[i].release()

            response.send(res)

            return res
        } catch (error) {
            console.log(error)
        }
    }

    public getManual = async (req, res) => {
        try {
            const userID = req.params.user_id
            const startDate = req.query.start_date
            const endDate = req.query.end_date
            const client: PoolClient = await pool.connect()

            console.time('Manual Query Execution')

            const sql = `WITH temp AS (
                    SELECT user_id, merchant_id, SUM(amount) AS amount
                    FROM transactions
                    WHERE date >= '${startDate}'::DATE AND date <= '${endDate}'::DATE
                    GROUP BY user_id, merchant_id
                ), spends AS (
                    SELECT merchant_id, amount FROM temp WHERE user_id = ${userID}
                ), result AS (
                    SELECT  spends.merchant_id, spends.amount, SUM(CASE WHEN temp.amount >= spends.amount THEN 1 ELSE 0 END) AS rank
                    FROM temp
                    INNER JOIN spends USING (merchant_id)
                    GROUP BY spends.merchant_id, spends.amount
                    ORDER BY spends.merchant_id
                ), user_info AS (
                    SELECT count(*) AS count FROM users
                )
                SELECT m.display_name, m.icon_url, m.funny_gif_url, 
                (CASE WHEN r.amount IS NULL THEN 0 ELSE r.amount END) AS amount, 
                (CASE WHEN r.amount IS NULL THEN 0 ELSE 100.0 * (user_info.count - r.rank) / user_info.count END) AS ranking
                FROM merchants AS m
                INNER JOIN result AS r ON (r.merchant_id = m.id)
                CROSS JOIN user_info
                ORDER BY m.id
            ;`
            
            const sqlResult = await client.query(sql)
            console.timeEnd('Manual Query Execution')

            client.release()         
            res.send(sqlResult.rows)

            return sqlResult.rows
        } catch (error) {
            console.log(error)
        }
    }
}
