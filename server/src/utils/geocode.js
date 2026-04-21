/**
 * Geocoding via Nominatim (OpenStreetMap) — completely free, no API key.
 * Rate limit: 1 request/second. Fine for one geocode per listing creation.
 */

/**
 * Convert a street address to [longitude, latitude] coordinates.
 * Returns null if geocoding fails — listing saves without coordinates.
 */
const geocodeAddress = async (address, city, state) => {
  const query = encodeURIComponent(`${address}, ${city}, ${state}, USA`);
  const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const res  = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'LetsMovNow/1.0 (student-rental-app)',
      },
    });
    const data = await res.json();

    if (!data || data.length === 0) return null;

    const { lon, lat } = data[0];
    return [parseFloat(lon), parseFloat(lat)]; // GeoJSON order: [lng, lat]
  } catch (err) {
    console.error('Geocoding error:', err.message);
    return null;
  }
};

/**
 * Haversine formula — calculate distance in miles between two [lng, lat] points.
 * Used to compute distanceToCampus without any paid API.
 */
const haversineDistance = (coords1, coords2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles

  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2)); // miles, rounded to 2 decimal places
};

module.exports = { geocodeAddress, haversineDistance };
