#!/bin/sh

python -m seeder.country
python -m seeder.commodity
python -m seeder.business_unit
python -m seeder.organisation
python -m seeder.tag
python -m seeder.region
python -m seeder.benchmark
python -m seeder.question
python -m seeder.reference_data

# old PL seeder
python -m seeder.procurement_library

# new PL seeder oct 2025
python -m seeder.procurement_library_v2