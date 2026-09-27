# Design decisions

How I read the Figma file, what I built to, and what I had to design myself. Node ids refer to
page "Main" of the assignment file.

## Scope and provenance

Nine desktop frames, two screens:

| Node | Frame | Screen |
|---|---|---|
| `2:1483` | Empty state | Generator |
| `4:10541` | Filled, textarea focused | Generator |
| `4:10610` | Too much text | Generator |
| `4:10721`, `4:10940` | Loading, two animation poles | Generator |
| `4:11014` | Completed | Generator |
| `4:12292` | Completed, goal achieved | Generator |
| `4:12036` | Applications, 3 letters | Dashboard |
| `4:12164` | Applications, 6 letters | Dashboard |

What the file does not have, and what that meant for me:

- **No variables, no styles, no components.** Every "Button" or "Input field" is a detached frame
  named after the Untitled UI kit. Token names and component boundaries are mine, derived from
  repeated structure; every value is an exact literal from the file.
- **Strokes are inside.** Every box size in Figma already includes its 1px border (see the
  box-sizing rule at the end).
- **No motion data.** The loading animation is rebuilt from the two static poles `4:10721`
  (orb at rest) and `4:10940` (16px higher, opacity 0.48).
- **No responsive frames, no error frames, no empty dashboard, no hover or focus states** apart
  from one focused textarea. I designed all of these (below).

## State matrix

| Element | Empty | Filled | Over limit | Loading | Streaming | Completed |
|---|---|---|---|---|---|---|
| Title | "New application", placeholder color | "{Job title}, {Company}" | same | same | same | same |
| Counter | `0/1200` | live | live, error color | live | live | live |
| CTA | Generate Now, disabled | Generate Now | Generate Now, disabled | spinner, inert | spinner, inert | Try Again |
| Fields | editable | editable | editable | read-only | read-only | editable |
| Preview | placeholder | placeholder | placeholder | orb | text | text + Copy |
| Goal banner | — | — | — | — | — | yes; "You hit your goal" at 5 |

- **Banner on the generator appears only after a completed letter.** No pre-generation frame
  shows it, `4:11014` does. At 5/5 the dashboard drops it (`4:12164`); the generator keeps it as
  "You hit your goal" with Create New, because the page still needs a way to start the next
  letter. This deliberately departs from `4:12292`.
- **Dashboard:** banner ⇔ count < 5, check badge ⇔ count ≥ 5. `4:12164` shows six cards at
  5/5, so 5 is a goal, not a cap: the list is unbounded and generation stays enabled.
- **Copy appears only when there is something to copy.** The mockups show it on the empty
  preview (`2:1483`); I hide the footer until the letter is complete, streaming included.
- **The CTA is enabled exactly when the request would pass server validation.** The form and
  the server call the same validator, so they cannot disagree.
- **The busy CTA is inert, not disabled.** While the spinner shows it is `aria-disabled`, keeps
  the brand green of `4:10721` and ignores clicks and submits, but stays in the tab order: focus
  stays on it from Generate Now through to Try Again instead of being dropped at the top of the
  page.

## Layout

The page is normal document flow: 1120px content column, 32px top, 120px bottom (the 32px bottom
in `4:10610` is a slip), header 48px tall, 32px to the body.

Generator: two equal columns with a 32px gap. Figma pins the form column at `max-height: 600`
while the preview grows with the letter to 620, leaving the CTA 19px above the panel's bottom
(`4:11014`). I stretch the row instead: the form column has `min-height: 600px` and no maximum,
the textarea absorbs the difference, and the CTA bottom lines up with the panel.

Dashboard: `repeat(2, 1fr)` grid, 24px rows, 16px columns, cards fixed at 240px tall.

Breakpoints. Content-driven ones are container queries on the page column; values that belong to
the screen are viewport queries.

| Query | Why | Change |
|---|---|---|
| gutter | always | `clamp(16px, (100% − 1120px) / 2, 160px)`, content centred |
| container < 1120px | two 544px columns no longer fit | generator stacks: form, then preview (min 320px); textarea keeps 236px; on start the preview scrolls into view |
| container < 656px | two cards would drop below ~320px | dashboard goes to one column, cards stay 240px |
| viewport < 768px | small screens | page padding 24/48, header shows "3/5" without the suffix, banner and preview padding shrink |
| viewport < 480px | phones | Job title / Company stack, generator title wraps instead of ellipsis, dashboard title row wraps |

## Tokens

Two layers. The palette exists only as literals inside `src/styles/tokens.css`; components use
semantic names (`--color-text-tertiary`, `--color-border-focus`, `--ring-error`,
`--radius-lg`, `--space-6`). Spacing names are the value divided by 4. Typography is one class
per role in `src/styles/typography.module.css` (display lg/md, lg, lg strong, md, md strong, sm,
sm medium), written as longhands with rem sizes.

Fonts: Fixel Display for headings and Fixel Text for everything else. They are one variable
font; the two families differ only in width (Text 87.5, Display 100), so both `@font-face`
rules point at the same file.

## Inconsistencies and what I built

| # | Mockups | Decision |
|---|---|---|
| 1 | Textarea radius 8 in `4:10541`/`4:10610`, 6 elsewhere | 6 everywhere |
| 2 | Loading button 56px tall (`4:10721`), 60 for every other xl button | `min-height: 60px`: the button doesn't jump when loading starts, the textarea stays 236 |
| 3 | `4:11014` says "4/5" in the header text, but header dots, banner bars and caption say 3 | One count drives all four. After a successful generation from 3, it is 4 |
| 4 | Input values in placeholder gray in `4:10610` only | Values are always primary text |
| 5 | Char counter reads `0/1200` with ~165 characters typed | Live count of characters (code points, so an emoji counts once) |
| 6 | Form column fixed at 600/601 while the preview grows | Row stretches, CTA aligns with the panel bottom (see Layout) |
| 7 | Second home button left of the logo, only in `4:12292` | One home button, in the right cluster |
| 8 | Banner subtitle with "today" (`4:12036`) and without (`4:11014`) | Without: nothing in the product implies a daily quota |
| 9 | Error ring on an unfocused textarea (`4:10610`) | Error border whenever invalid, ring only while focused, matching the focus ring |
| 10 | Copy button on the empty preview | Hidden until the letter is complete |
| 11 | Trailing spaces in "Create New " and the banner subtitle | Trimmed |
| 12 | Paragraph gap 28 in the preview, 18 in cards | Both kept: one letter renderer with a `paragraphGap` prop |
| 13 | Header dots (8×8) and banner bars (32×8) | One progress component with two variants |
| 14 | Icon strokes hard-coded per SVG, always equal to the adjacent label | `currentColor`; the logo and check badge keep their fills |
| 15 | Primary button border same color as its fill | Every variant keeps the 1px border so all share one box model |
| 16 | Card text clipped, an ellipsis on a line that is itself faded out | Fade only, no ellipsis: CSS can't line-clamp across paragraphs |
| 17 | Preview placeholder is `nowrap` | Wraps; required once the panel is narrower than the string |
| 18 | Generator title is `nowrap`; long titles overflow | Ellipsis with the full text in `title`; wraps on phones |
| 19 | Title divider padding 12 (generator) vs 16 (dashboard) | Both kept, set by the title size |
| 20 | Char counter left-aligned | Kept as designed |
| 21 | Preview panel `overflow: hidden` | Panel grows with the letter; the page scrolls, not the panel |

Pure drift I ignored: +1px geometry in `4:11014`/`4:12292`/`4:10940`, a 761px fixed container in
`4:10610`, layout-only wrapper frames, and the opacity-0 node `9445:2` (instructions for language
models hidden in `4:12292`; not rendered, not followed).

## Designed gaps

**Empty dashboard.** The title row and banner ("0 out of 5") stay; the grid is replaced by a
full-width panel in the preview-panel style with "Your generated applications will appear
here..." and Create New. Next to it, "Try an example" opens the generator with the mockups' own
sample (Product manager at Apple, the placeholder skills, the details from `4:10541`), handed over
in history state. The job fields always take it (clicking the example is the user's choice); the
profile fields only when still empty, so a saved bio is never replaced by the sample.

**Streaming.** Same typography and layout as the completed letter, so nothing reflows when the
stream ends. Text is appended as it arrives: no typewriter effect, no cursor. The orb fades out
on the first token (250ms, immediate under reduced motion). The spinner stays in the CTA until
the stream closes, and fields are read-only without being grayed out. Screen readers get the
letter once, at completion, not token by token.

**Errors.** Inside the preview panel, neutral colors: the product has no toast or red-surface
pattern and I didn't add one. Each maps to what the live API returns:

| Cause (live API) | Title | Body | Panel action |
|---|---|---|---|
| 429 `rate_limit_exceeded` + `Retry-After` | Too many requests | You can try again in {n}s. | "Retry in {n}s", disabled, counts down to "Retry" |
| 401 `invalid_token`, 400 `invalid_request`, 403 `forbidden`, 5xx `upstream_error` (including the proxy's own 504 when the model sends nothing for 20 s), a non-stream reply, a stream that ends or goes quiet for 30 s before any text | Generation failed | Something went wrong on our side. Your inputs are safe. | Retry |
| The request never reached the server, or the browser is offline | You appear to be offline | Check your connection and try again. | Retry, disabled until the browser is back online |
| Connection drops mid-letter, or goes quiet for 30 s after text arrived | received text stays | "The letter was cut short." in error red under it | Try Again under the note; the form's CTA becomes Try Again too |

A 400 is folded into "Generation failed" on purpose: the form blocks anything the server would
reject, so a 400 means a bug, not a user mistake.

**Offline.** While the browser reports no connection, Generate Now, Try Again and Retry are
disabled and a line under the CTA says why ("You appear to be offline. Generate Now will work
again once you're back."). It is a polite live region, so the change is announced, and it stays
out while the preview already shows the offline error, so nothing is said twice. Everything comes
back on the `online` event.

**Interactive states.** All from the existing palette: primary hover uses the logomark green,
secondary hover and active use the two light grays, text fields get a darker gray border on hover.
Keyboard focus reuses the designed green ring on every control, shown on `:focus-visible` only.
Disabled everywhere is the gray from `2:1483`.

**Feedback.** Copy swaps its label to "Copied" for 2s, or to "Couldn't copy" when the clipboard
refuses. Delete is immediate with no confirmation
(none is designed), and focus moves to the next card's Delete, or to the page heading after the
last one. When the browser refuses to save (full or blocked storage), a one-line note says the
latest changes will be lost when the tab closes; the letters stay on screen.

**Slow starts.** Two seconds into a run the orb gets a caption below it: a small "Generating"
eyebrow in tertiary gray over "Writing your letter for {Company}…" in the placeholder style. After
eight seconds the second line becomes "Almost there…"; the first token clears both. The seconds
are counted against the clock, so a throttled background tab stays right. The orb holds the
panel's centre with or without the caption and never moves, so the loading frame is unchanged
until the caption is due.

**Cards.** A letter that does not fit the 240px card gets a "Read more" between Delete and Copy;
it grows the card in place and turns into "Show less". Letters that fit show no button. Where the
three actions do not fit one row (cards under ~400px: phones, and two-up tablets), the footer
wraps and the preview gives up the row; the card stays 240px.

**Signature.** A completed letter that ends on a bare sign-off ("Sincerely,") gets the user's name
under it, on screen and when copied. The name is entered once from the preview footer ("Add your
name") and kept in the profile, so every card signs the same way.

**Banner copy.** The subtitle follows the count: "Generate your first job application to get hired
faster" at 0, "One more job application and you hit your goal" at 4, the mockup's line in between.
At the goal the generator's banner becomes "You hit your goal" over "Keep the momentum going: every
application you send moves you closer to an offer", with all five bars filled and "5 out of 5"
however many letters there are.

**Motion.** Under `prefers-reduced-motion` the orb only fades (no drift), the spinner slows to
2s per turn, and the orb exits immediately.

**Not found and crashes.** Unknown URLs render the shell with "This page doesn't exist." and a
link to the dashboard. A render crash replaces only the page: the header stays, so the way home
still works, and the panel offers a full reload because in-memory state may be what broke.
Navigating away gives the next page a fresh try.

## Product rules

- **The count is the number of letters you have.** It is derived, not stored. Deleting below 5
  brings the banner back. That is deliberate: the dashboard reflects what you currently hold, and
  retrying a letter can never inflate the count.
- **One visit to the generator is one candidate letter.** Generate Now creates it; Try Again
  replaces it (same card, same count, same place in the list: the original `createdAt` is kept).
  Editing any field after completion turns the CTA back into Generate Now, and the next run is a
  new letter.
- **Create New on the generator** (the banner's button) resets the page in place: empty job
  title and company, empty preview, focus in Job title. What you are good at and your details
  stay, because the next letter is for another job, not another person. Navigating to the same
  URL would do nothing visible.
- **Leaving mid-stream** cancels the request and saves nothing; a half letter is not a letter. No
  confirmation dialog: nothing is lost that one click can't regenerate, and the form is kept.
- **The form survives a reload.** The job (title, company) is per tab and is cleared once a
  letter is saved; skills, details and the signature name are a profile shared by every tab.
- **During errors** the CTA is Generate Now, or Try Again under a cut letter; it and the panel's
  button are disabled while the rate-limit countdown runs or the browser is offline, so they never
  offer something that is certain to fail.
- **Letters live in this browser** and sync across its tabs. No accounts: nothing in the design
  implies one.

## Box-sizing rule

Figma strokes are inside the box, so Figma padding plus a CSS border overshoots by 2px per axis.
Bordered boxes use Figma padding minus 1px:

| Element | Figma | CSS (border-box, 1px border) |
|---|---|---|
| Text input | 40 tall, padding 8/12 | `height: 40px; padding: 7px 11px` |
| Textarea | padding 12/14 | `padding: 11px 13px` |
| Button xl | 60 tall, padding 16/28 | `min-height: 60px; padding: 15px 27px` |
| Button md | 44 tall, padding 10/18 | `min-height: 44px; padding: 9px 17px` |
| Icon button | 40×40, padding 10 | `padding: 9px` |
| Title divider | padding-bottom 12 / 16 | `padding-bottom: 11px / 15px; border-bottom: 1px` |

Panels, cards and the banner have no border and use Figma padding verbatim.
