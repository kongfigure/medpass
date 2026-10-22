#!/usr/bin/env bash
# The dataset lives in data/interactions.json. The iOS package needs its own copy
# because Swift packages cannot read files outside their folder.
set -euo pipefail
cd "$(dirname "$0")/.."
cp data/interactions.json ios/MedKit/Sources/MedKit/Resources/interactions.json
echo "Synced dataset to ios/MedKit."
