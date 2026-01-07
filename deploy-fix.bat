@echo off
cd "c:\Users\DANIEL\Documents\Website Projects\game-count-system\game-count-system"
git add lib/index.ts lib/jwt.ts openapi.json
git commit -m "fix: Correct lib/index.ts exports and add missing modules"
git push origin main
echo Done!
pause
