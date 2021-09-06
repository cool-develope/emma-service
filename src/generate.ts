import {createTable} from './dbconfig/dbcreator'

// @ts-ignore
import * as dotenv from 'dotenv'

dotenv.config({ path: __dirname + '/../.env' })

createTable()