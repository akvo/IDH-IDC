#!/usr/bin/env bash

alembic upgrade head

./generate_config.sh

python main.py
