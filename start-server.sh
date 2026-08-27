#!/bin/zsh
# Автозапуск tech-diagnostics в production-режиме.
# При изменении кода: git pull + build, затем старт.
cd /Users/mac3/dev/tech-diagnostics || exit 1
export PATH="/Users/mac3/.hermes/node/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

# Если есть новые изменения из git — пересобрать
if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
  git pull --ff-only >/dev/null 2>&1
fi

# Build (если исходники новее последнего билда)
if [ ! -d ".next" ] || find app components lib db -newer .next/BUILD_ID 2>/dev/null | grep -q .; then
  echo "$(date) rebuilding..." >> /tmp/tech-diagnostics.log
  npm run build >> /tmp/tech-diagnostics.log 2>&1
fi

exec npx next start --hostname 0.0.0.0 --port 3000
