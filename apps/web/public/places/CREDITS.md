# Image credits

## Ethiopian food photography — removed

Two CC BY-SA 4.0 photos (`ethiopian-traditional.jpg` from
[Injera with eight kinds of stew](https://commons.wikimedia.org/wiki/File:Injera_with_eight_kinds_of_stew.jpg)
by Artem.G, and `ethiopian-modern.jpg` from
[Ethiopian vegetarian sampler](https://commons.wikimedia.org/wiki/File:Ethiopian_vegetarian_sampler.jpg)
by Sdkb) briefly stood in for the landing-page hero mosaic.

That mosaic has since been **replaced by an abstract brand panel** that uses no
photography at all, so both files were deleted. **No CC BY-SA assets ship with
the site**, and there is no attribution obligation to satisfy on the public
pages.

## Pre-existing images

The remaining files in this directory (`cafe-*`, `event-*`, `food-1`…`food-8`,
`night-*`) predate this work and carry **no recorded attribution or licence**.
Their provenance is unknown.

They are generic Western stock photography, and **none of them depict Ethiopian
food, drink or venues** — a contact sheet of the full set is at
`logs/places-contact-sheet.png`. That mismatch is why the landing page once
showed a Western restaurant interior under the alt text "A shared Ethiopian meal
served on injera".

Two of them are still rendered in the app:

| File | Where | Notes |
|---|---|---|
| `food-4.jpg` | `app/auth/layout.tsx` — the faded backdrop behind the sign-in / sign-up card | A Western café interior |
| `food-3.jpg` | `components/RidePlanner.tsx` — a 56px thumbnail | A Western café interior |

`food-2.jpg` is also referenced as a cover image by
`packages/supabase/seed-places.sql:42`, so it was left on disk; deleting it would
break a fresh `npm run supabase:apply`.

**Recommendation:** replace these with real Addis Ababa photography — or drop
them in favour of the same photo-free treatment now used in the hero — before
launch. The unknown provenance is the bigger risk than the look.
