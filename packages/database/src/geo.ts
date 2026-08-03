export function buildPostGisPoint(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const nearbyBranchesQuery = `
  SELECT *, 
    ST_Distance(
      location::geography, 
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
    ) / 1000 AS distance_km
  FROM "BusinessBranch"
  WHERE location IS NOT NULL
  ORDER BY location::geography <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  LIMIT $3;
`;
