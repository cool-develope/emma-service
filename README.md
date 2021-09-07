# Emma-Service

## Introduction
First need to generate the test data, the table size is based on **.env** file.
The scripts to generate, test, and serve are as follow:

```bash
npm run generate
npm run test
npm run serve
```

Test using the following urls, can also test the performance.

- http://localhost:3000/api/user/manual/1?start_date=2019-02-01&end_date=2021-08-01
- http://localhost:3000/api/user/parallel/1?start_date=2019-02-01&end_date=2021-08-01

This implementation is focused to improve the unit transaction, maybe need to improve the scalalbility using cache techniques (i.e. redis).

## Docker Build

```bash
docker build --no-cache -t gcr.io/emma/emma-server:latest .
docker-compose -p emma up
```

