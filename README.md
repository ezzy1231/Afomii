# UrbanExplore

UrbanExplore is a Turborepo monorepo with a Next.js web app, a NestJS backend, Prisma/PostGIS data access, and Supabase-based auth.

## Local Development

1. Install dependencies:

```powershell
npm install
```

2. Copy the example env files:

```powershell
Copy-Item .env.example .env
Copy-Item apps\web\.env.example apps\web\.env.local
```

3. Start the required services:

```powershell
docker compose up -d postgres redis
```

4. Start the backend:

```powershell
npm run dev --workspace=@urbanexplore/backend
```

5. Start the web app:

```powershell
npm run dev --workspace=@urbanexplore/web
```

6. Open the site:

```text
http://localhost:3000
```

## Google Maps Setup (Ride Page)

The ride page uses Google Maps in the browser for address autocomplete, geocoding, and route drawing.

1. Create a Google Cloud project.
2. Enable billing on that project.
3. Enable these APIs:
	- Maps JavaScript API
	- Places API
	- Geocoding API
4. Create an API key and restrict it:
	- Application restriction: HTTP referrers
	- Local referrer: `http://localhost:3000/*`
	- Production referrer: your deployed frontend domain(s)
5. Add the key to `apps/web/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

The variable is also listed in `apps/web/.env.example`.

## Hosting Notes

- Host the Next.js app on Vercel or another Node-compatible frontend host.
- Host the NestJS backend on a Node service such as Render, Railway, Fly.io, or a VPS.
- Use a managed PostgreSQL database with PostGIS enabled and a Redis instance.
- Set the same environment variables from the example files in your deployment provider.

## Repository Safety

- Do not commit `.env` or `.env.local`.
- Commit `.env.example` files instead so other developers can configure the project safely.