# IDH-IDC

[![Build Status](https://github.com/akvo/IDH-IDC/actions/workflows/test.yml/badge.svg)](https://github.com/akvo/IDH-IDC/actions/workflows/test.yml?query=main) [![Repo Size](https://img.shields.io/github/repo-size/akvo/IDH-IDC)](https://img.shields.io/github/repo-size/akvo/IDH-IDC) [![Languages](https://img.shields.io/github/languages/count/akvo/IDH-IDC)](https://img.shields.io/github/languages/count/akvo/IDH-IDC) [![Issues](https://img.shields.io/github/issues/akvo/IDH-IDC)](https://img.shields.io/github/issues/akvo/IDH-IDC) [![Last Commit](https://img.shields.io/github/last-commit/akvo/IDH-IDC/main)](https://img.shields.io/github/last-commit/akvo/IDH-IDC/main)
<!-- [![Coverage Status](https://coveralls.io/repos/github/akvo/rtmis/badge.svg)](https://coveralls.io/github/akvo/rtmis)  -->

Income Driver Calculator

## Prerequisite

- Docker > v19
- Docker Compose > v2.1
- Docker Sync 0.7.1

## Development

### Environment Setup

Expected that PORT 5432 and 3000 are not being used by other services.

.env

```bash
EMAIL_HOST=""
EMAIL_PORT="587"
EMAIL_HOST_USER=""
EMAIL_HOST_PASSWORD=""
EMAIL_USE_TLS="true"
EMAIL_USE_SSL="false"
```

`EMAIL_USE_TLS` (STARTTLS, port 587) and `EMAIL_USE_SSL` (implicit SSL, port
465) are mutually exclusive; the defaults above match the common relay. Leave
`EMAIL_HOST` empty during local development and mail sending simply fails and
is logged.

### Start

For initial run, you need to create a new docker volume.

```bash
docker volume create idc-docker-sync
./dc.sh up -d
```

Note: On some linux systems, you may need to change the permissions of the directory where the volume is stored.

The development site should be running at: [localhost:3000](http://localhost:3000).

### Seeder

#### Master Data

```bash
./dc.sh exec backend ./seed_master.sh
```

#### User

```bash
./dc.sh exec backend python -m seeder.user
```

Password for the new user added via CLI is: `password`


### Running Backend Test

```bash
./dc.sh exec backend ./check.sh
```


### Log

```bash
./dc.sh log --follow <container_name>
```

Available containers:

- backend
- frontend
- mainnetwork
- db
- pgadmin

### Stop

```bash
./dc.sh stop
```

### Teardown

```bash
./dc.sh down -t1
docker volume rm idc-docker-sync
```
