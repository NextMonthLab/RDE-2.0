# DIST FOLDERS COMMIT REQUIRED

## Issue
The `/dist` folders are not appearing in GitHub because they're excluded by `.gitignore`.

## Solution
For Hetzner Docker deployment, these build artifacts must be committed:

### Required Files in GitHub:
- `pallet/backend/dist/index.js` (compiled backend)
- `pallet/frontend/dist/index.html` (built frontend)
- `pallet/backend/package-lock.json` (dependency lock)
- `pallet/frontend/package-lock.json` (dependency lock)

### Manual Steps:
1. Comment out `dist` in root `.gitignore`
2. Force add dist folders: `git add pallet/*/dist/ -f`
3. Commit: `git commit -m "Add dist folders for Hetzner deployment"`
4. Push to GitHub

### Verification:
Check GitHub repository contains:
```
pallet/
├── backend/
│   ├── dist/index.js ✅
│   └── package-lock.json ✅
└── frontend/
    ├── dist/index.html ✅
    └── package-lock.json ✅
```

These files are essential for Docker build process on Hetzner VPS.