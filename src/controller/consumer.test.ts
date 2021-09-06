import { ConsumerController } from './consumer'

// @ts-ignore
import * as dotenv from 'dotenv'

dotenv.config({ path: __dirname + '/../../.env' })

jest.setTimeout(50000)

describe("ConsumerController", () => {
    test("two results should be equal", async () => {
        const controller = new ConsumerController()
        const request = { 'params': { 'user_id': 1 }, 'query': { 'start_date': '2019-01-01', 'end_date': '2021-08-01' } }
        const response = { send: () => {}}

        const results = await Promise.all([
            controller.getParallel(request, response),
            controller.getManual(request, response)
        ])

        expect(results[0]).toEqual(results[1])
    });
});