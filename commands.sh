#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Just in time installers, these functions replace themselves with the real command when called for the first time

function curl() {
  unset -f curl
  if [[ ! $(command -v curl) ]]; then
    sudo apt install -y curl
  fi
  curl "$@"
}
export -f curl


function mise() {
  unset -f mise
  if [[ ! -f "$HOME/.local/bin/mise" ]]; then
    echo "* Downloading and installing mise..."
    curl https://mise.run | sh > /dev/null 2>&1
  fi
  eval "$(mise env)"
  mise "$@"
}
export -f mise


function node() {
  unset -f node
  mise install node
  eval "$(mise env)"
  node "$@"
}
export -f node


function npm() {
  unset -f npm
  node -v > /dev/null 2>&1
  npm "$@"
}
export -f npm


function bun() {
  unset -f bun
  mise install bun
  eval "$(mise env)"
  bun "$@"
 }
 export -f bun

# If this script is being executed (not sourced) and has an argument, run it with bun
if [[ "${BASH_SOURCE[0]}" == "${0}" && -n "${1}" ]]; then
    bun "$@"
    exit $?
fi