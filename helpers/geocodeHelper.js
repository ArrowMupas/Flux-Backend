const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { getCache, setCache } = require('../utilities/cache');

async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;

  // Check cache first -- Policy of Nominatim
  const cached = getCache(key);
  if (cached) {
    console.log(`[Cache Hit] Reverse geocode for ${key}`);
    return cached;
  }

  // Call Nominatim if not cached
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AlasHotSauce/1.0 (alaswebthesis@gmail.com)',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reverse geocode');
  }

  const data = await response.json();
  const address = data.display_name || '';

  // Save result in cache (6 hours) Adjust if needed.
  setCache(key, address, 6 * 60 * 60);

  console.log(`[Cache Set] Reverse geocode for ${key}`);
  return address;
}

module.exports = { reverseGeocode };