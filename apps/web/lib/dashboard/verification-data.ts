import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Read model for the verification workflow.
 *
 * A partner (restaurant business or event organizer) asks to be verified and an
 * admin decides. Both consoles render the same component from this data; the
 * admin console additionally lists the queue.
 *
 * Why this exists at all: ensureBusiness / ensureOrganizer insert neither
 * `status` nor `is_verified`, so every new partner sits on the
 * pending/unverified column defaults. private.business_is_public /
 * private.organizer_is_public both require status = 'active' AND
 * is_verified = true, so until an admin decides, that partner's listings are
 * invisible on the public catalogue. Previously the only route to a decision
 * was an admin happening to open the admin list and press Verify — the partner
 * had no way to ask and no way to find out they were waiting.
 */

export const VERIFICATION_DOCS_BUCKET = 'verification-docs'

/** How long an admin's document link stays usable. Short by design. */
const SIGNED_URL_TTL_SECONDS = 300

export type VerificationEntityType = 'business' | 'organizer'

export type VerificationRequestStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'needs_info'

export type VerificationDocument = {
  label: string
  /** Storage object path inside the private bucket. Never a public URL. */
  path: string
  contentType: string
  sizeBytes: number
}

export type VerificationRequest = {
  id: string
  entity_type: VerificationEntityType
  entity_id: string
  owner_id: string
  status: VerificationRequestStatus
  legal_name: string
  registration_number: string | null
  tax_id: string | null
  phone: string | null
  address: string | null
  city: string | null
  website: string | null
  note: string | null
  documents: VerificationDocument[]
  reviewer_id: string | null
  reviewer_note: string | null
  submitted_at: string
  decided_at: string | null
  created_at: string
  updated_at: string
}

type UserLike = { id: string }

const REQUEST_COLUMNS =
  'id, entity_type, entity_id, owner_id, status, legal_name, registration_number, tax_id, phone, address, city, website, note, documents, reviewer_id, reviewer_note, submitted_at, decided_at, created_at, updated_at'

/** Statuses that still need a human decision; drives the "one live request" index. */
const OPEN_STATUSES: VerificationRequestStatus[] = ['pending', 'in_review', 'needs_info']

/**
 * `documents` is jsonb with a CHECK that it is an array, but nothing enforces
 * the shape of each element, so cast rather than trust.
 */
function toRequest(row: unknown): VerificationRequest | null {
  if (!row || typeof row !== 'object') return null
  const raw = row as Record<string, unknown>
  const docs = Array.isArray(raw.documents) ? raw.documents : []
  return {
    ...(raw as unknown as VerificationRequest),
    documents: docs.filter(
      (d): d is VerificationDocument =>
        !!d &&
        typeof d === 'object' &&
        typeof (d as VerificationDocument).path === 'string',
    ),
  }
}

export function verificationIsOpen(
  status: string | null | undefined,
): boolean {
  return OPEN_STATUSES.includes(status as VerificationRequestStatus)
}

/**
 * The partner's current state: their entity row plus their most recent request.
 *
 * Returns the newest request by `submitted_at` rather than filtering to open
 * ones, so the console can explain a rejection instead of silently offering to
 * resubmit with no context.
 */
export async function getVerificationState(
  supabase: SupabaseClient,
  user: UserLike,
  entityType: VerificationEntityType,
): Promise<{
  entityId: string
  entityName: string
  isVerified: boolean
  status: string | null
  request: VerificationRequest | null
  history: VerificationRequest[]
}> {
  const table = entityType === 'business' ? 'businesses' : 'organizers'

  const [entityRes, requestsRes] = await Promise.all([
    supabase
      .from(table)
      .select('id, name, status, is_verified')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1),
    supabase
      .from('verification_requests')
      .select(REQUEST_COLUMNS)
      .eq('owner_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(20),
  ])

  const entity = (entityRes.data?.[0] ?? null) as
    | { id: string; name: string; status: string | null; is_verified: boolean | null }
    | null

  const history = ((requestsRes.data ?? []) as unknown[])
    .map(toRequest)
    .filter((r): r is VerificationRequest => r !== null)
    .filter((r) => r.entity_type === entityType)

  return {
    entityId: entity?.id ?? '',
    entityName: entity?.name ?? '',
    isVerified: entity?.is_verified === true,
    status: entity?.status ?? null,
    request: history[0] ?? null,
    history,
  }
}

export type VerificationQueueRow = {
  id: string
  entityType: VerificationEntityType
  entityId: string
  entityName: string
  ownerEmail: string | null
  status: VerificationRequestStatus
  legalName: string
  registrationNumber: string | null
  city: string | null
  documentCount: number
  submittedAt: string
  decidedAt: string | null
}

/**
 * The admin queue. `scope` picks the slice: the work that needs doing, or one
 * specific status for auditing past decisions.
 */
export async function getVerificationQueue(
  supabase: SupabaseClient,
  scope: 'open' | 'all' | VerificationRequestStatus,
): Promise<{ rows: VerificationQueueRow[]; openCount: number }> {
  let query = supabase
    .from('verification_requests')
    .select('id, entity_type, entity_id, status, legal_name, registration_number, city, documents, submitted_at, decided_at, owner_id')
    .order('submitted_at', { ascending: true })
    .limit(200)

  if (scope === 'open') {
    query = query.in('status', OPEN_STATUSES)
  } else if (scope !== 'all') {
    query = query.eq('status', scope)
  }

  const { data, error } = await query
  if (error) {
    console.error('[verification] queue query failed:', error.message)
    return { rows: [], openCount: 0 }
  }

  const rows = ((data ?? []) as unknown[])
    .map(toRequest)
    .filter((r): r is VerificationRequest => r !== null)

  // Entity and owner names live on other tables; RLS lets a system_admin read
  // them, and a missing row must not drop a request out of the queue.
  const businessIds = rows.filter((r) => r.entity_type === 'business').map((r) => r.entity_id)
  const organizerIds = rows.filter((r) => r.entity_type === 'organizer').map((r) => r.entity_id)
  const ownerIds = [...new Set(rows.map((r) => r.owner_id))]

  const [businessRes, organizerRes, profileRes, openRes] = await Promise.all([
    businessIds.length
      ? supabase.from('businesses').select('id, name').in('id', businessIds)
      : Promise.resolve({ data: [] as unknown[] }),
    organizerIds.length
      ? supabase.from('organizers').select('id, name').in('id', organizerIds)
      : Promise.resolve({ data: [] as unknown[] }),
    ownerIds.length
      ? supabase.from('profiles').select('id, email').in('id', ownerIds)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      .from('verification_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', OPEN_STATUSES),
  ])

  const names = new Map<string, string>()
  for (const b of (businessRes.data ?? []) as { id: string; name: string }[]) {
    names.set(`business:${b.id}`, b.name)
  }
  for (const o of (organizerRes.data ?? []) as { id: string; name: string }[]) {
    names.set(`organizer:${o.id}`, o.name)
  }
  const emails = new Map<string, string>()
  for (const p of (profileRes.data ?? []) as { id: string; email: string | null }[]) {
    emails.set(p.id, p.email ?? '')
  }

  return {
    openCount: openRes.count ?? 0,
    rows: rows.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityName: names.get(`${r.entity_type}:${r.entity_id}`) ?? 'Unknown',
      ownerEmail: emails.get(r.owner_id) || null,
      status: r.status,
      legalName: r.legal_name,
      registrationNumber: r.registration_number,
      city: r.city,
      documentCount: r.documents.length,
      submittedAt: r.submitted_at,
      decidedAt: r.decided_at,
    })),
  }
}

/** Full request plus whatever the entity is called, for the review screen. */
export async function getVerificationRequest(
  supabase: SupabaseClient,
  id: string,
): Promise<{ request: VerificationRequest; entityName: string; ownerEmail: string | null } | null> {
  const { data } = await supabase
    .from('verification_requests')
    .select(REQUEST_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  const request = toRequest(data)
  if (!request) return null

  const table = request.entity_type === 'business' ? 'businesses' : 'organizers'
  const [entityRes, profileRes] = await Promise.all([
    supabase.from(table).select('name').eq('id', request.entity_id).maybeSingle(),
    supabase.from('profiles').select('email').eq('id', request.owner_id).maybeSingle(),
  ])

  return {
    request,
    entityName:
      ((entityRes.data as { name?: string } | null)?.name ?? 'Unknown'),
    ownerEmail:
      (profileRes.data as { email?: string | null } | null)?.email ?? null,
  }
}

/**
 * Short-lived signed URLs for an admin to actually open the documents.
 *
 * The bucket is private, so this is the only way a reviewer sees what was
 * submitted. 5 minutes is deliberate: a link pasted into a chat stops working
 * almost immediately.
 */
export async function signVerificationDocuments(
  supabase: SupabaseClient,
  documents: VerificationDocument[],
): Promise<Map<string, string>> {
  const signed = new Map<string, string>()
  for (const doc of documents) {
    const { data, error } = await supabase.storage
      .from(VERIFICATION_DOCS_BUCKET)
      .createSignedUrl(doc.path, SIGNED_URL_TTL_SECONDS)
    if (error) {
      console.error('[verification] could not sign document:', error.message)
      continue
    }
    signed.set(doc.path, data.signedUrl)
  }
  return signed
}