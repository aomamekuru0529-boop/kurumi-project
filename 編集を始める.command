#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js 22以降（LTS）を https://nodejs.org/ からインストールしてください。'
  read -r -p 'Enterで閉じます。'
  exit 1
fi
if [ ! -f node_modules/esbuild/package.json ]; then
  npm ci || { read -r -p 'インストールに失敗しました。Enterで閉じます。'; exit 1; }
fi
npm run edit
read -r -p 'Enterで閉じます。'
