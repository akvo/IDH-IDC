#!/usr/bin/env bash
set -eu

# Run the Python command to import and execute the function
python -c "from core.config import generate_config_file; generate_config_file(); exit()"
