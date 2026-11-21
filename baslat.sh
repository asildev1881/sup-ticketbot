#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js yüklü değil: https://nodejs.org"; exit 1; }
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env oluşturuldu. İçine botunun tokenini yaz (nano .env) ve tekrar çalıştır."
  exit 0
fi
[ -d node_modules ] || npm install
npm start
