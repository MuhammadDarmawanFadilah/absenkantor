package com.shadcn.backend.config;

/**
 * LocationDataLoader - REMOVED
 * 
 * This class previously contained hardcoded Indonesian location data.
 * It has been completely removed as we now use the wilayah.id API integration
 * through WilayahController for official, up-to-date location data.
 * 
 * Migration Details:
 * - Old: Hardcoded provinces, cities, districts data
 * - New: Real-time API calls to https://wilayah.id/
 * - Integration: WilayahController + WilayahService + WilayahCacheService
 * 
 * Benefits:
 * - Always up-to-date data from official source
 * - No hardcoded maintenance required
 * - Consistent with government standards
 * - Automatic data updates
 */

// This file is kept for reference only - the class has been completely removed
// Use WilayahController API endpoints instead:
// - GET /api/wilayah/provinces
// - GET /api/wilayah/regencies/{provinceCode}
// - GET /api/wilayah/districts/{regencyCode}
// - GET /api/wilayah/villages/{districtCode}
