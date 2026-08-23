#!/usr/bin/env node
/**
 * Fetches real restaurant/cafe listings from Google Places API (New)
 * and generates:
 *   1. Downloaded photos  -> apps/web/public/places/{placeId}.jpg
 *   2. Idempotent seed SQL -> packages/supabase/seed-places.sql
 *
 * Usage:  node scripts/fetch-places.mjs
 * Reads NEXT_PUBLIC_GOOGLE_MAPS_API_KEY from apps/web/.env.local
 * Run the generated SQL in the Supabase SQL editor afterwards.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PLACES_DIR = join(ROOT, 'apps', 'web', 'public', 'places')
const SQL_OUT = join(ROOT, 'packages', 'supabase', 'seed-places.sql')

// --- read API key from apps/web/.env.local -------------------------------
function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

const env = {
  ...readEnvFile(join(ROOT, '.env')),
  ...readEnvFile(join(ROOT, 'apps', 'web', '.env.local')),
  ...process.env,
}
const KEY = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
if (!KEY) {
  console.error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (apps/web/.env.local)')
  process.exit(1)
}

// --- Places API (New) ------------------------------------------------------
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.primaryTypeDisplayName',
  'places.photos',
].join(',')

async function textSearch(textQuery) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, pageSize: 20, languageCode: 'en', regionCode: 'ET' }),
  })
  if (!res.ok) {
    throw new Error(`Places search failed (${res.status}): ${await res.text()}`)
  }
  const json = await res.json()
  return json.places ?? []
}

async function downloadPhoto(photoName, outFile) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=900&key=${KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Photo download failed (${res.status}) for ${photoName}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(outFile, buf)
  return buf.length
}

// --- config ----------------------------------------------------------------
const QUERIES = [
  'best restaurants in Addis Ababa',
  'cafe in Addis Ababa',
  'bakery in Addis Ababa',
  'juice bar in Addis Ababa',
]
const MAX_PLACES = 24
const MIN_RATING = 3.6
const MIN_REVIEWS = 25

function areaLabel(address) {
  // "X Y Rd, Bole, Addis Ababa" -> take the segment before the city
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  const cityIdx = parts.findIndex((p) => /addis ababa/i.test(p))
  if (cityIdx > 0) return parts[cityIdx - 1]
  return parts[0] ?? 'Addis Ababa'
}

function sqlStr(value) {
  if (value == null) return 'null'
  return `'${String(value).replace(/'/g, "''")}'`
}

// --- run --------------------------------------------------------------------
;(async () => {
  mkdirSync(PLACES_DIR, { recursive: true })

  console.log('Searching Places API…')
  const byId = new Map()
  for (const q of QUERIES) {
    try {
      const places = await textSearch(q)
      for (const p of places) {
        if (!byId.has(p.id)) byId.set(p.id, p)
      }
      console.log(`  ${q}: ${places.length} results`)
    } catch (err) {
      console.warn(`  query failed: ${q} — ${err.message}`)
    }
  }

  const all = [...byId.values()]
    .filter(
      (p) =>
        p.displayName &&
        p.formattedAddress &&
        (p.rating ?? 0) >= MIN_RATING &&
        (p.userRatingCount ?? 0) >= MIN_REVIEWS &&
        p.photos?.length
    )
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, MAX_PLACES)

  console.log(`${all.length} qualifying places (rating ≥ ${MIN_RATING}, reviews ≥ ${MIN_REVIEWS})`)

  const rows = []
  for (const p of all) {
    const photo = p.photos.find((ph) => ph.name)
    const imgPath = `/places/${p.id}.jpg`
    const outFile = join(PLACES_DIR, `${p.id}.jpg`)

    if (photo && !existsSync(outFile)) {
      try {
        const bytes = await downloadPhoto(photo.name, outFile)
        console.log(`  photo ${p.displayName.text} — ${Math.round(bytes / 1024)}kb`)
      } catch (err) {
        console.warn(`  photo failed for ${p.displayName.text}: ${err.message}`)
        continue
      }
    } else if (!photo) {
      continue
    }

    rows.push({
      placeId: p.id,
      name: p.displayName.text,
      cuisine: p.primaryTypeDisplayName?.text ?? p.primaryType ?? 'Restaurant',
      address: p.formattedAddress,
      area: areaLabel(p.formattedAddress),
      rating: p.rating ?? null,
      reviews: p.userRatingCount ?? 0,
      image: imgPath,
    })
  }

  // --- generate SQL ---------------------------------------------------------
  const values = rows
    .map(
      (r) => `
-- ${r.name} (★${r.rating ?? '?'} · ${r.reviews} reviews)
with b_${r.placeId.replace(/-/g, '_')} as (
  insert into public.businesses (name, description, is_verified, status)
  values (${sqlStr(`seed:${r.placeId}`)}, ${sqlStr(`${r.name} — ${r.cuisine} in ${r.area}, Addis Ababa.`)}, true, 'active')
  returning id
),
bid_${r.placeId.replace(/-/g, '_')} as (
  select id from b_${r.placeId.replace(/-/g, '_')}
  union all
  select id from public.businesses where name = ${sqlStr(`seed:${r.placeId}`)} limit 1
),
r_${r.placeId.replace(/-/g, '_')} as (
  insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
  select id, ${sqlStr(r.name)}, ${sqlStr(r.cuisine)}, ${sqlStr(r.cuisine)}, ${sqlStr(`${r.name} — ${r.cuisine} in ${r.area}, Addis Ababa.`)}, 'Addis Ababa', ${sqlStr(r.area)}, 'Open daily', ${sqlStr(r.image)}, true, true, ${r.rating ?? 'null'}
  from bid_${r.placeId.replace(/-/g, '_')}
  where not exists (select 1 from public.restaurants where name = ${sqlStr(r.name)})
  returning id, business_id
)
insert into public.branches (business_id, branch_name, address)
select business_id, ${sqlStr(`${r.name} — ${r.area}`)}, ${sqlStr(r.address)}
from r_${r.placeId.replace(/-/g, '_')}
where not exists (select 1 from public.branches where branch_name = ${sqlStr(`${r.name} — ${r.area}`)});`
    )
    .join('\n')

  const sql = `-- seed-places.sql
-- Real Addis Ababa listings fetched from Google Places API (New).
-- Idempotent: re-running replaces previous seed:* businesses only.
-- Run in Supabase SQL editor.

delete from public.businesses where name like 'seed:%';

${values}
`

  writeFileSync(SQL_OUT, sql)
  writeFileSync(join(PLACES_DIR, 'manifest.json'), JSON.stringify(rows, null, 2))

  console.log(`\nDone. ${rows.length} places written.`)
  console.log(`SQL:   ${SQL_OUT}`)
  console.log(`Photos: ${PLACES_DIR}`)
  console.log('\nNext: run seed-places.sql in the Supabase SQL editor.')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
