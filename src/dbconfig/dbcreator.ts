import pool from './dbconnector'

export const createTable = async () => {
    try {
        const client = await pool.connect()

        const dropQuery = `DROP TABLE IF EXISTS users, merchants, transactions;`

        const createUsersQuery = `CREATE TABLE users (
            id serial PRIMARY KEY,
            first_name VARCHAR ( 64 ) NOT NULL,
            last_name VARCHAR ( 64 ) NOT NULL    
        );`

        const createMerchantsQuery = `CREATE TABLE merchants (
            id serial PRIMARY KEY,
            display_name VARCHAR ( 256 ) NOT NULL,
            icon_url VARCHAR ( 1024 ),
            funny_gif_url VARCHAR ( 1024 )
        );`

        const createTransactionsQuery = `CREATE TABLE transactions (
            id serial PRIMARY KEY,
            user_id INT NOT NULL,
            merchant_id INT NOT NULL,
            date DATE,
            amount NUMERIC ( 20, 3 ),
            description VARCHAR ( 1024 ),
            FOREIGN KEY (user_id)
                REFERENCES users (id),
            FOREIGN KEY (merchant_id)
                REFERENCES merchants (id)
        );`

        const createIndexQuery = `CREATE INDEX idx_transaction_id
            ON transactions(user_id, merchant_id)
        ;`

        let merchantDenseCount = parseInt(process.env.MERCHANT_COUNT)
        let userDenseCount = parseInt(process.env.USER_COUNT)

        if (process.env.TEST_CASE == 'GENERAL') {
            // general case
            // uniform distribution
        } else if (process.env.TEST_CASE == 'USER_DENSE') {
            userDenseCount = 1000
        } else if (process.env.TEST_CASE == 'MERCHANT_DENSE') {
            merchantDenseCount = 1000
        } else if (process.env.TEST_CASE == 'BOTH_DENSE') {
            userDenseCount = 1000
            merchantDenseCount = 1000
        }

        const insertUsersQuery = `INSERT INTO users (first_name, last_name)
            SELECT 'first_' || seq, 'last_' || FLOOR(RANDOM() * ${process.env.USER_COUNT} + 1)
            FROM GENERATE_SERIES(1, ${process.env.USER_COUNT}) seq
        ;`

        const insertMerchantsQuery = `INSERT INTO merchants (display_name, icon_url, funny_gif_url)
        SELECT 
            'merchant_' || seq, 
            'icon_' || seq,
            'funny_gif_' || seq
        FROM GENERATE_SERIES(1, ${process.env.MERCHANT_COUNT}) seq
    ;`

        const insertTransactionsQuery = `INSERT INTO transactions (user_id, merchant_id, date, amount, description)
        SELECT 
            FLOOR(RANDOM() * ${userDenseCount} + 1), 
            FLOOR(RANDOM() * ${merchantDenseCount} + 1),
            CURRENT_DATE - ((RANDOM() * 1000)::INT * interval '1 day'),
            RANDOM() * 1000,
            'description'
        FROM GENERATE_SERIES(1, ${process.env.TRANSACTION_COUNT}) seq
    ;`

        await client.query(dropQuery)
        await client.query(createUsersQuery)
        await client.query(createMerchantsQuery)
        await client.query(createTransactionsQuery)
        await client.query(createIndexQuery)
        await Promise.all([
            client.query(insertUsersQuery),
            client.query(insertMerchantsQuery),
        ])
        await client.query(insertTransactionsQuery)

        client.release()
    } catch (error) {
        console.log(error)
    }
}
