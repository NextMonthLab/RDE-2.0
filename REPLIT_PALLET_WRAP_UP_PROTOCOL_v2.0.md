# REPLIT FINAL PALLET WRAP-UP BUILD PROTOCOL v2.0

## Overview
This is the standardized protocol for preparing any Replit project for Hetzner strict Docker deployment with full build compliance.

## Steps (Execute in Order)

### 1️⃣ Clean Install Dependencies
```bash
cd pallet/backend && rm -rf node_modules package-lock.json && npm install && npm install --package-lock-only
cd ../../frontend && rm -rf node_modules package-lock.json && npm install && npm install --package-lock-only
```

### 2️⃣ Run Production Builds
```bash
cd pallet/backend && npm run build
cd ../../frontend && npm run build
```

### 3️⃣ Verify Required Files Exist
**Backend:**
- ✅ `pallet/backend/package.json`
- ✅ `pallet/backend/package-lock.json`
- ✅ `pallet/backend/dist/index.js` (or full dist folder)

**Frontend:**
- ✅ `pallet/frontend/package.json`
- ✅ `pallet/frontend/package-lock.json`
- ✅ `pallet/frontend/dist/index.html` (or full dist folder)

### 4️⃣ Commit All Updated Files to GitHub
**Include:**
- Package-lock.json files
- Dist folders
- Any updated Dockerfile if modified
- Updated documentation

### 5️⃣ Confirm Successful Completion
```bash
echo "✅ PALLET BUILD COMPLETE. READY FOR HETZNER DOCKER BUILD."
```

## Next Phase
After protocol completion:
1. ✅ Pause and go to GitHub manually
2. ✅ Visually verify all required files exist exactly as expected
3. ✅ Pull into Hetzner VPS
4. ✅ Rebuild Docker container with locked dependencies

## Protocol Status
- **Version**: 2.0
- **Status**: STANDARDIZED
- **Usage**: Apply to any Replit project requiring Docker deployment
- **Compliance**: Full Hetzner VPS compatibility