# Console.log Removal Configuration

## Overview
Aplikasi Absensi Lampung dikonfigurasi untuk **menghapus** semua `console.log` statements pada saat deploy ke production untuk optimasi performa dan mengurangi ukuran bundle.

## Configuration

### Next.js Compiler Configuration
File: `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  // Remove console.log in production using Next.js built-in compiler
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'] // Keep console.error and console.warn for debugging
    } : false,
  },
}
```

### What Gets Removed
✅ **REMOVED in production:**
- `console.log()`
- `console.info()`
- `console.debug()`

✅ **KEPT in production:**
- `console.error()` - Untuk debugging error
- `console.warn()` - Untuk debugging warning

### Environment Behavior
- **Development (`NODE_ENV=development`)**: Console statements KEPT untuk debugging
- **Production (`NODE_ENV=production`)**: Console.log statements REMOVED

## Scripts

### Build Commands
```bash
# Normal build
npm run build

# Build with console removal verification
npm run build:verify
```

### Verification
Setelah build, jalankan script verifikasi:
```bash
node scripts/verify-console-removal.js
```

Script ini akan:
1. Scan semua file JavaScript di `.next/static`
2. Mencari console statements yang tersisa
3. Report hasil dan analisis

## Best Practices

### Development
```javascript
// ✅ GOOD: Use console.log for development debugging
console.log('Debug data:', data);
console.info('Information message');

// ✅ GOOD: Use console.error for error handling
console.error('Error occurred:', error);
console.warn('Warning message:', warning);
```

### Production Considerations
```javascript
// ✅ GOOD: Use console.error for critical errors (will be kept)
try {
  // code
} catch (error) {
  console.error('Critical error:', error); // KEPT in production
}

// ✅ GOOD: Use console.warn for important warnings (will be kept)
if (isDeprecated) {
  console.warn('Feature deprecated:', feature); // KEPT in production
}

// ❌ AVOID: console.log in production code (will be removed)
console.log('User clicked button'); // REMOVED in production
```

## Deployment

### Manual Deployment
```bash
# Ensure NODE_ENV is production
export NODE_ENV=production

# Build with verification
npm run build:verify

# Deploy
npm start
```

### Automated Deployment
Script deployment sudah dikonfigurasi di `redeploy-frontend-absenkantor.sh`:
```bash
# Automatically sets NODE_ENV=production
export NODE_ENV=production
sudo NODE_ENV=production pnpm run build:verify
```

## Verification Results

### Successful Configuration
```
✅ SUCCESS: No console statements found in production build!
🎉 Console.log removal is working correctly.
```

### Partial Success (Expected)
```
❌ WARNING: Console statements found in production build:
💡 Possible reasons:
- Console statements in node_modules (expected)
- Console.error statements (intentionally kept)
- Server-side code (may keep some console statements)
```

## Troubleshooting

### Console.log Still Appears
1. Check `NODE_ENV` is set to `production`
2. Verify `next.config.ts` configuration
3. Clear `.next` folder and rebuild
4. Run verification script

### Performance Benefits
- **Bundle size reduction**: ~5-15% smaller
- **Runtime performance**: Faster execution
- **Production readiness**: Clean production logs

## Files Affected
- `next.config.ts` - Configuration
- `package.json` - Build scripts
- `scripts/verify-console-removal.js` - Verification
- `redeploy-frontend-absenkantor.sh` - Deployment

## Notes
- Server-side code may still contain console statements (normal)
- Node modules console statements are expected
- Only affects client-side JavaScript bundles
- Development debugging not affected

---
*Last updated: August 24, 2025*