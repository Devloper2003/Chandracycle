#!/bin/bash
# Watchdog: keeps the Next.js dev server alive by restarting it if it crashes.
cd /home/z/my-project
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date +%H:%M:%S)] next-server down, restarting..." >> /home/z/my-project/watchdog.log
    # Start dev server (NODE_OPTIONS is in package.json dev script)
    setsid bun run dev < /dev/null >> /home/z/my-project/dev.log 2>&1 &
    sleep 15
  fi
  sleep 5
done
