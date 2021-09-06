import * as express from 'express'
import {ConsumerController} from './controller/consumer'

// @ts-ignore
import * as dotenv from 'dotenv'

dotenv.config({ path: __dirname + '/../.env' })

const app = express()

app.get('/', async (request, response) => {
  response.send('Test Server!')
})

const consumerController = new ConsumerController()
app.get('/api/user/manual/:user_id', consumerController.getManual)
app.get('/api/user/parallel/:user_id', consumerController.getParallel)

app.listen(3000)
