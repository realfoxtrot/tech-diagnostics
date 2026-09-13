#!/bin/bash
cd /Users/mac3/dev/tech-diagnostics
./node_modules/.bin/next start -H 0.0.0.0 -p 3000 >>/tmp/tech-diagnostics.log 2>&1
