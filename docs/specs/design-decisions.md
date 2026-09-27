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
| CTA | Generate Now, inert | Generate Now | Generate Now, inert | spinner, inert | spinner, inert | Try Again |
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
- **The CTA runs exactly when the request would pass server validation.** The form and the
  server call the same validator, so they cannot disagree. The hint below reads the same rules
  field by field only to name what is missing.
- **The busy CTA is inert, not disabled.** While the spinner shows it is `aria-disabled`, keeps
  the brand green of `4:10721` and ignores clicks and submits, but stays in the tab order: focus
  stays on it from Generate Now through to Try Again instead of being dropped at the top of the
  page.
- **So is a CTA that can't run yet.** On an incomplete or over-limit form, offline, or during a
  rate-limit countdown, Generate Now (or Try Again) is `aria-disabled`: the gray of `2:1483`,
  still in the tab order. The mockups mark no field as required, so on an invalid form a click or
  Enter says under the button what to fix ("Add a job title, a company and what you're good at to
  generate.", or "Shorten the field over its limit to generate.") and moves the caret there; the
  next edit clears it. Offline or counting down, a click does nothing: the note or the countdown
  already says why.
- **The tab title follows the h1:** "New application · Alt+Shift" until both job fields are
  filled, then "{Job title}, {Company} · Alt+Shift".

## Layout

The page is normal document flow: 1120px content column, 32px top, 120px bottom (the 32px bottom
in `4:10610` is a slip), header 48px tall, 32px to the body.

Generator: two equal columns with a 32px gap. The form column stays at 600px, as in `4:11014`,
and the preview grows with the letter beside it. Real letters run to about 1000px; a form
stretched to match would turn the textarea into a mostly empty box and push Try Again below the
fold, so the CTA stays in the first screen and doesn't move while the letter streams. An empty or
loading preview fills the 600px row. Side by side, the line under the CTA hangs below the form
instead of growing the row, so pressing the gray CTA never moves the panel.

Dashboard: `repeat(2, 1fr)` grid, 24px rows, 16px columns, cards fixed at 240px tall.

Header: below 390px the logo is the one item that gives up width, down to 109px at 320, so the
Home button stays on screen. Its width follows the page, not the space the counter leaves, so it
doesn't jump when the dots turn into the check badge at 5/5.

Breakpoints. Content-driven ones are container queries on the page column; values that belong to
the screen are viewport queries.

| Query | Why | Change |
|---|---|---|
| gutter | always | `clamp(16px, (100% − 1120px) / 2, 160px)`, content centered |
| container < 1120px | two 544px columns no longer fit | generator stacks: form, then preview (min 320px); textarea keeps 236px; on start the preview scrolls into view |
| container < 656px | two cards would drop below ~320px | dashboard goes to one column, cards stay 240px |
| viewport < 768px | small screens | page padding 24/48, header shows "3/5" without the suffix, banner and preview padding shrink |
| viewport < 480px | phones | Job title / Company stack, generator title wraps instead of ellipsis, dashboard title row wraps, header items sit closer (24px to 16px) |

## Tokens

Two layers. The palette exists only as literals inside `src/styles/tokens.css`; components use
semantic names (`--color-text-tertiary`, `--color-border-focus`, `--ring-error`,
`--radius-lg`, `--space-6`). Spacing names are the value divided by 4. Typography is one class
per role in `src/styles/typography.module.css` (display lg/md, lg, lg strong, md, md strong, sm,
sm medium), written as longhands with rem sizes.

Fonts: Fixel Display for headings and Fixel Text for everything else. They are one variable
font; the two families differ only in width (Text 87.5, Display 100), so both `@font-face`
rules point at the same file.

The textarea scrollbar follows `4:10610`: a 4px thumb inset 12px from the top and 8px from the
right. On a desktop pointer its 11px gutter is always reserved and taken back from the right
padding, so the text wraps at the designed width whether or not the scrollbar shows. Touch
browsers keep their overlay scrollbar and Firefox its thin one.

## Inconsistencies and what I built

| # | Mockups | Decision |
|---|---|---|
| 1 | Textarea radius 8 in `4:10541`/`4:10610`, 6 elsewhere | 6 everywhere |
| 2 | Loading button 56px tall (`4:10721`), 60 for every other xl button | `min-height: 60px`: the button doesn't jump when loading starts, the textarea stays 236 |
| 3 | `4:11014` says "4/5" in the header text, but header dots, banner bars and caption say 3 | One count drives all four. After a successful generation from 3, it is 4 |
| 4 | Input values in placeholder gray in `4:10610` only | Values are always primary text |
| 5 | Char counter reads `0/1200` with ~165 characters typed | Live count of characters (code points, so an emoji counts once) |
| 6 | Form column fixed at 600/601 while the preview grows | Kept as designed: the form stays 600, the preview grows (see Layout) |
| 7 | Second home button left of the logo, only in `4:12292` | One home button, in the right cluster |
| 8 | Banner subtitle with "today" (`4:12036`) and without (`4:11014`) | Without: nothing in the product implies a daily quota |
| 9 | Error ring on an unfocused textarea (`4:10610`) | Error border whenever invalid, ring only while focused, matching the focus ring |
| 10 | Copy button on the empty preview | Hidden until the letter is complete |
| 11 | Trailing spaces in "Create New " and the banner subtitle | Trimmed |
| 12 | Paragraph gap 28 in the preview, 18 in cards | Both kept: one letter renderer with a `spacing` prop (`compact` 18 for cards, `comfortable` 28 for the preview) |
| 13 | Header dots (8×8) and banner bars (32×8) | One progress component with two variants |
| 14 | Icon strokes hard-coded per SVG, always equal to the adjacent label | `currentColor`; the logo and check badge keep their fills |
| 15 | Primary button border same color as its fill | Every variant keeps the 1px border so all share one box model |
| 16 | Card text clipped, an ellipsis on a line that is itself faded out | Fade only, and only on a clipped letter; Read more takes the ellipsis's place at the end of the faded line. CSS can't line-clamp across paragraphs |
| 17 | Preview placeholder is `nowrap` | Wraps; required once the panel is narrower than the string |
| 18 | Generator title is `nowrap`; long titles overflow | Ellipsis with the full text in `title`; wraps on phones |
| 19 | Title divider padding 12 (generator) vs 16 (dashboard) | Both kept, set by the title size |
| 20 | Char counter left-aligned | Kept as designed |
| 21 | Preview panel `overflow: hidden` | Panel grows with the letter; the page scrolls, not the panel |

Pure drift I ignored: +1px geometry in `4:11014`/`4:12292`/`4:10940`, a 761px fixed container in
`4:10610`, layout-only wrapper frames, and the opacity-0 node `9445:2` (instructions for language
models hidden in `4:12292`; not rendered, not followed).

## Designed gaps

**Empty dashboard.** The title row and banner ("0 out of 5") stay, both with Create New. The grid
is replaced by a full-width panel in the preview-panel style that says what the product is: a
one-line pitch in lg strong ("Tell Alt+Shift the job, the company and what you're good at, and it
writes the cover letter."), then "Your generated applications will appear here...", then one
secondary action, "Try an example", and under it a small trust note: no sign-up, the details go
to the generation service only to write the letter, and the letters stay in this browser, all
true of the code as it stands. Create New left the panel: three on one screen was two too many, and the panel's job is the path that needs no
typing.

"Try an example" opens the generator with the mockups' own sample (Product manager at Apple, the
placeholder skills, the details from `4:10541`, finished from the letter in `4:11014`), handed over
in history state and cleared from it after the first render, so a reload or Back never applies it
again over later edits. The job fields always take it; the profile fields only when empty, so a
saved bio is never replaced by the sample. The sample's skills and details are never saved as the
user's profile: the tab's draft keeps them next to the job until they are edited, so a reload
shows the whole example again, and Create New clears the ones the user didn't edit, so their next
letter never goes out with the sample's bio.

**Streaming.** Same typography and layout as the completed letter, so nothing reflows when the
stream ends. Text is appended as it arrives, with no typewriter effect. While it writes, the
panel itself shows it: a white "Writing…" chip with a pulsing brand dot sits on the panel's top
edge above the first line, and a soft light band sweeps across the grey background every 2.4
seconds. The chip says "Still writing…" after 3 seconds without new text, since the live API
pauses mid-letter now and then. It sits on the edge, not in the text column, so nothing moves
when it goes at the end. The orb fades out on the first token (250ms,
immediate under reduced motion). The spinner stays in the CTA until the stream closes, and
fields are read-only without being grayed out.

**Announcements.** The panel is a named region ("Your letter"), not a live region, so a screen
reader never reads the letter as it streams. One status line outside it says "Generating your
letter…" when a run starts (streaming says the same, so it is not repeated), "Your letter is ready.
Copy it, or use Try Again for another version." when it completes, and "The letter was cut short."
when it is cut. Every
other error speaks through its own alert, which holds fixed text only. Status lines that can change
(the offline note and the hint under the CTA, a field's error, the storage note) stay mounted, empty
and off screen until they have something to say, because a status is announced when its text
changes, not when it is inserted already holding it.

**Errors.** Inside the preview panel, neutral colors: the product has no toast or red-surface
pattern and I didn't add one. Each maps to what the live API returns:

| Cause (live API) | Title | Body | Panel action |
|---|---|---|---|
| 429 `rate_limit_exceeded` + `Retry-After` | Too many requests | The generation service is at its limit right now. You can try again in {n}s. | "Retry in {n}s", inert, counts down to "Retry" |
| 401 `invalid_token`, 400 `invalid_request`, 403 `forbidden`, 5xx `upstream_error` (including the proxy's own 504 when the model sends nothing for 20 s), a non-stream reply, a stream that ends or goes quiet for 30 s before any text | Generation failed | Something went wrong on our side. Your inputs are safe. | Retry |
| The request never reached the server, or the browser is offline | You appear to be offline | Check your connection and try again. | Retry, inert until the browser is back online |
| Connection drops mid-letter, goes quiet for 30 s after text arrived, or the stream ends (with or without `[DONE]`) mid-sentence | received text stays | "The letter was cut short." in error red under it | Try Again under the note; the form's CTA becomes Try Again too. After an edit the panel's button goes and the note stays |
| Any of the first three on a run started over a finished letter (Try Again, or Generate Now after an edit), before any text | the previous letter stays, with Copy and the signature | "{Title}. {Body} Your previous letter is kept." in tertiary gray above it, or "{Title}. {Body} Showing your previous letter, {Job title}, {Company}." when an edit has changed the job since; then the countdown on a 429 | Try Again under the note, "Retry in {n}s" while counting down. After an edit the button goes and the note stays |

A 400 is folded into "Generation failed" on purpose: the form blocks anything the server would
reject, so a 400 means a bug, not a user mistake.

The note over a kept letter is tertiary, not error red: the letter below it is fine, and it is still
saved. It sits above the letter because after an edit the page title already names the new job, and
a note at the letter's end would be below the fold. A Try Again that is cut keeps the saved letter
the same way, under "The letter was cut short. Your previous letter is kept.", and so does a
failure after it. On a 429 the seconds tick outside the accessibility tree (the button's label
carries them), and "You can try again now." is announced once when the wait ends, unless the
button is still blocked. Every button in the panel follows the form's CTA: inert while the form is
invalid, the browser is offline or a countdown runs.

**Offline.** While the browser reports no connection, every generate button is inert and a status
under the CTA says why ("You appear to be offline. Generating will work again once you're back."),
unless the preview already shows the offline error. Everything comes back on the `online` event.

**Interactive states.** All from the existing palette: primary hover uses the logomark green,
secondary hover and active use the two light grays, text fields get a darker gray border on hover
(not while read-only during a run). Keyboard focus reuses the designed green ring on every control,
shown on `:focus-visible` only. Nothing in the app is natively disabled. Hover styles apply only
where the pointer can hover, so a tap does not leave a button in its hover color.

**Arrival focus.** Arriving on the generator with an empty job puts the caret in Job title, except
on touch-only devices (`(hover: none) and (pointer: coarse)`), where it would open the on-screen
keyboard over the page. The test is input modality, not width: a tablet is wide, and a narrow
desktop window still has a keyboard.

**Feedback.** Copy swaps its label to "Copied" for 2s, or to "Couldn't copy" when the clipboard
refuses. Delete is immediate with no confirmation
(none is designed), and focus moves to the next card's Delete, or to the page heading after the
last one. When the browser refuses to save (full or blocked storage), a one-line status says the
latest changes will be lost when the tab closes; the letters stay on screen.

**Slow starts.** Two seconds into a run the orb gets a caption: a small "Generating" eyebrow over
"Writing your letter for {Company}…", which becomes "Almost there…" at eight seconds; the first
token clears both. Each line reveals left to right, then a lighter band sweeps across it every
1.4 seconds (`ShimmerText`; static text under reduced motion and in forced colors). The orb holds
the panel's center with or without the caption, so the loading frame is unchanged until the
caption is due.

**Same role, another company.** People apply for one role at many companies, so once a letter is
copied the preview offers "Same role, another company" under its footer. It appears only after a
copy, the moment the letter is put to use, so the completed frame is unchanged at rest. The click
clears Company and puts the caret there, with "Next company" as its placeholder instead of the
mockup's "Apple"; job title, skills and details stay, and the next run is a new letter. Until
then the saved letter stays on screen tagged "Saved · {Job title}, {Company}", and keeps its Copy.
The same tag shows whenever the form's job no longer matches the letter on screen.

**Cards.** The footer keeps Figma's two actions, Delete and Copy. A letter the 240px card clips
gets a "Read more" over the end of its last, faded line, so it takes no row of its own; letters
that fit show neither. Clipping is measured again whenever the card or its text changes size (a
resize, the webfont swap, a signature added in another tab). Read more opens the whole letter in a
dialog over the page, at most 640px wide, with Close and Copy; Escape or a click outside closes it
and focus returns to Read more. A card grown in place would jump to a row of its own from the right
column, or leave a hole beside its neighbor, and run the letter in lines 1000px long. Only a card
narrower than Delete and Copy together (a 320px phone) wraps the footer; the preview gives up a
line and the card stays 240px.

**Signature.** A letter that ends on a bare closing ("Sincerely,", as the prompt asks, or one the
model picks instead, "Warmly," or "З повагою," included) gets the user's name under it, on screen
and when copied; a letter the model signed itself keeps its own. The name is entered once from the
preview footer ("Add your name", then "Change name") and kept in the profile, so every card signs
the same way, in every tab. The field replaces the button: its label is spoken, not shown, and
doubles as the placeholder. Enter or leaving it saves, Escape cancels, and closing it from the
keyboard puts focus back on the button. It takes up to 300 characters, the form's single-line
limit, made hard because a field that saves on blur has nowhere to show an error. "Add your name"
is offered only under a closing, the one place the name goes.

**Banner copy.** The subtitle follows the count: "Generate your first job application to get hired
faster" at 0, "One more job application and you hit your goal" at 4, the mockup's line in between.
At the goal the generator's banner becomes "You hit your goal" over "Keep the momentum going: every
application you send moves you closer to an offer", with all five bars filled and "5 out of 5"
however many letters there are.

**Motion.** Under `prefers-reduced-motion` the orb only fades (no drift), the spinner slows to
2s per turn, and the orb exits immediately.

**Not found and crashes.** Unknown URLs render the shell with "This page doesn't exist." and a
link to the dashboard. A render crash replaces only the page, so the header and its way home stay:
an h1 "Something went wrong" takes focus over "This page stopped working." and a full reload,
because in-memory state may be what broke. Navigating away gives the next page a fresh try.

## Product rules

- **The count is the number of letters you have.** It is derived, not stored. Deleting below 5
  brings the banner back. That is deliberate: the dashboard reflects what you currently hold, and
  retrying a letter can never inflate the count.
- **One visit to the generator is one candidate letter.** Generate Now creates it; Try Again
  replaces it (same card, same count, same place in the list: the original `createdAt` is kept).
  Editing any field after completion turns the CTA back into Generate Now, and the next run is a
  new letter. A failed Try Again keeps the same id, so the next success still replaces the letter.
- **Create New on the generator** (the banner's button) resets the page in place: empty job title
  and company, empty preview, focus in Job title. What you are good at and your details stay,
  because the next letter is for another job, not another person; only an example's bio the user
  never edited goes with its job. Navigating to the same URL would do nothing visible.
- **Leaving mid-stream** cancels the request and saves nothing; a half letter is not a letter. No
  confirmation dialog: nothing is lost that one click can't regenerate, and the form is kept.
- **The form survives a reload.** The job (title, company) is per tab, with an example's
  unedited bio beside it; its stored copy is forgotten once the letter is saved and written again
  on the next edit of any field. Skills,
  details and the signature name are a profile shared by every tab and kept in step across them;
  a page that only reads it never writes it.
- **During errors** the CTA stays Try Again, until a field is edited, while a letter is on screen
  or this visit's letter is already saved; the letter store, not the screen, answers the last one,
  so the next run replaces that letter. A regenerate that fails never takes away the letter you
  already have; a successful one replaces it.
- **Letters live in this browser** and sync across its tabs. No accounts: nothing in the design
  implies one.

How these rules are meant to move conversion: [conversion.md](conversion.md).

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
