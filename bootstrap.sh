#!/usr/bin/env bash

if [[ ! $(command -v mise) ]]; then
  echo "mise is required: https://mise.jdx.dev/getting-started.html" >&2
  exit 1
fi
mise install
eval "$(mise env)"

# If this script is being executed (not sourced) and has an argument, run it with bun
if [[ "${BASH_SOURCE[0]}" == "${0}" && -n "${1}" ]]; then
    bun "$@"
    exit $?
fi
