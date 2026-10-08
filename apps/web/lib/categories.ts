/**
 * Canonical event categories.
 *
 * The create-event form's <select> and the discover feed's filter chips both
 * read from this list. They were previously independent — a hardcoded chip row
 * in ExploreCatalogue and a free-text field on the form — so an organizer who
 * typed "food and music" produced an event that no "Food & Drink" chip could
 * match, and near-duplicates like "Music"/"Live music" split the same audience.
 *
 * Keep this list in sync with anything that needs to group events, and add new
 * entries here rather than inline.
 */
export const EVENT_CATEGORIES = [
  "Music",
  "Food & Drink",
  "Theatre",
  "Exhibition",
  "Networking",
  "Wellness",
  "Community",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Sentinel used by the filter chip row; not a real category. */
export const ALL_CATEGORIES = "All";