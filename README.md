# Alt+Shift

**Live:** `<deployment URL>`

## About

A cover-letter generator: fill in the job, the company and what you're good at, and a letter
streams into the preview as the model writes it. Letters are kept in your browser and listed on
the dashboard. A goal banner nudges you toward five applications.

Two screens: the dashboard (`/`) and the generator (`/new`). Desktop follows the Figma mockups.
The empty dashboard, the tablet and mobile layouts, streaming, errors and interactive states are
my own design, explained in [docs/specs/design-decisions.md](docs/specs/design-decisions.md).

## Try it

- In a fresh browser, click **Try an example** on the dashboard: the generator opens filled with
  the mockups' own request, and **Generate Now** streams the letter into the preview.
- Or type your own job. Cmd/Ctrl+Enter submits from the details field too. A click on the gray
  button says what is still missing and puts the caret there.
- **Try Again** regenerates in place: same card, same count. Edit any field first and the next run
  is a new letter.
- **Add your name** under a finished letter signs it, on screen and when copied.
- Reload: the letters stay (this browser only), and so does a form you haven't generated from yet.
  **Create New** clears the job and keeps what you're good at and your details.
- Go offline (DevTools → Network → Offline): the line under the button says why it waits.

The live app runs on one generation key with a limit of six requests a minute, shared by everyone
trying it. "Too many requests" with a countdown means the key is at that limit, often because
someone else is generating at the same time. The button in the preview counts down and works again
at zero. If it happens on Try Again, the letter you had stays on screen, Copy included.

## Run locally

Node 24 (`.node-version`) and pnpm 10 (pinned in `packageManager`).

```sh
pnpm i && pnpm dev
```

No accounts or keys needed. Without a token the API route runs the **mock provider**, which
replays real API responses recorded in `server/fixtures/` at a realistic pace, with your job
title and company written into the letter. Failure scenarios can be triggered with the
`x-mock-scenario` request header: `disconnect`, `rate-limit`, `upstream-error`, `invalid-token`
(anything else is a 400).

To use the real Generation API, copy `.env.example` to `.env.local` and set
`GENERATION_API_TOKEN`. The dev server logs which provider is active at startup. Deployments
(`VERCEL_ENV` set) always use the real API and refuse to start without the token.

| Variable | Default | Effect |
|---|---|---|
| `GENERATION_API_TOKEN` | — | Set: the real API. Empty: the mock |
| `GENERATION_PROVIDER` | — | `variant` or `mock` forces one locally; any other value stops the dev server; ignored on deployments |
| `GENERATION_API_URL` | the Variant endpoint | Where the real provider posts |
| `GENERATION_FIRST_BYTE_TIMEOUT_MS` | `20000` | How long the real provider waits for upstream headers before answering 504 |
| `MOCK_FIRST_DELTA_MS` / `MOCK_DELAY_MS` | `1200` / `40` | Mock pacing: before the first delta, then between deltas |

`pnpm dev` serves the API route through a small Vite plugin that mounts the same handler the
Vercel function exports. `vercel dev` also works for checking parity with production, but it
needs a linked project and `GENERATION_API_TOKEN`: it sets `VERCEL_ENV`, so it always uses the real
API.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Vite dev server with `/api/generate` |
| `build` / `preview` | Type-check and build to `dist/` / serve the build (static only, no `/api/generate`) |
| `typecheck` | `tsc -b` over app, server and tests |
| `lint` / `format` / `check` | Biome |
| `test` / `test:watch` / `test:coverage` | Vitest: `node` project for `server/`, `shared/`, `scripts/`; `jsdom` project for `src/` |
| `test:e2e` | Playwright against the mock provider on port 4173, desktop 1440×900 and mobile 375×812; journeys whose checks don't depend on the width run on desktop only |
| `storybook` / `build-storybook` | Component and page catalogue |
| `record:fixture <short\|medium\|long>` | Records a real API response into `server/fixtures/` (needs `.env.local`; costs one request) |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, coverage, build and e2e on pushes to `main`
and on pull requests.

## Architecture

**Proxy.** The browser never talks to the Generation API. It posts the four form fields to
`/api/generate` (`api/generate.ts` → `server/generate.ts`), which validates them with the same
function the form uses (`shared/generation.ts`), builds the prompt on the server
(`server/prompt.ts`), and streams the upstream body back byte for byte. The token stays on the
server, and clients can't send arbitrary prompts on my key. Only `Content-Type`, `Retry-After` and
`X-Request-Id` are forwarded from upstream. Leaving the page mid-stream cancels the upstream request
(`supportsCancellation` in `vercel.json`, `request.signal` passed through).

Each generation writes one JSON line to the function log: the provider, the status, the wait for
upstream headers, the lengths of the skills and details, and the upstream request id. A request
the browser drops before it ends adds a `generate_cancelled` line. The field text is never
logged. `vercel logs` reads these lines, and they are the one server-side signal the funnel under
[Conversion](#conversion) has today.

Cross-origin requests get a 403. The demo spends one shared key with a limit of six requests a
minute, so a page on another origin must not be able to drain it through its visitors' browsers.
The check reads `Sec-Fetch-Site`, which browsers always send, and `Origin` against `Host`, which
they always send on a POST; requests without them (curl, Playwright's request context) pass. This
is CSRF hygiene, not authentication: the app has no users to authenticate. The real provider also
waits at most 20 s for upstream headers (`GENERATION_FIRST_BYTE_TIMEOUT_MS`) and answers 504
otherwise; the timer is cleared once the body streams, so a slow model mid-letter is never cut
off, but one that never starts does not hang the function.

**Providers.** `server/providers/` has two: `variant` (the real API) and `mock`. `resolveProvider`
picks one per request from the environment: deployments always use `variant`, locally a token
means `variant` and no token means `mock`. Both get the validated request and the incoming headers
and return a standard `Response`, so the handler doesn't know which one it's talking to.

The mock picks a transcript by the length of the details (short, medium, long), swaps the recorded
job title and company for the request's, and re-chunks the text to the recorded delta sizes so the
pacing stays real. The requests the transcripts were recorded with live next to them
(`server/fixtures/samples.ts`) and are shared with `record:fixture`, so the recorder and the mock
cannot drift apart. The recorder sends them through the production provider and writes nothing
when the transcript has no text, or never says the sample's job title and company verbatim: the
mock could not put your job into that letter. The `x-mock-scenario` header picks a fault instead.

**Streaming pipeline.** `src/features/generation/generationClient.ts` reads the body with
`TextDecoder` in streaming mode, `shared/sseParser.ts` implements the event-stream grammar,
`shared/variantDecoder.ts` turns events into text deltas, and the client yields them as an async
iterable. The two modules sit in `shared/` because the mock and the fixture recorder use them too.
A read that waits more than 30 s fails the run instead of leaving a spinner that never stops, and
after `[DONE]` the client drains the connection for up to 2 s so the browser records the request
as completed rather than aborted. `useGeneration.ts` batches deltas into one render per animation
frame and flushes before the final state, so no tail is lost. State lives in a pure reducer
(`generationReducer.ts`), which also keeps a complete letter on screen through a new run that
fails before any text arrives. The page gets the client through `GenerationProvider`, which is how
tests and Storybook substitute a fake without mocking modules.

**State.** Letters live in a zustand store (`src/features/letters/store.ts`) over an async
`LetterRepository`: `localStorageRepository.ts` in the app, `inMemoryRepository.ts` in tests. A
shared contract suite runs against both. The store updates memory first, then persists; a failed
write keeps the letter on screen and shows a note. Storage events keep tabs in sync. The in-flight
letter is page-local state and is written to the store once, when the stream completes. Try Again
writes under the same id, and the store keeps the original `createdAt`, so the card stays where it
was instead of jumping to the top.

Form fields survive a reload. The job title and company are a per-tab draft in `sessionStorage`
(`src/features/generation/useGeneratorFields.ts`), forgotten once its letter is saved and saved
again on the next edit. Skills, details and the signature name are a profile in `localStorage`
(`src/features/profile/useProfile.ts`) that carries over to the next letter and follows `storage`
events, so a name set in one tab signs the cards in another; a page that only reads the profile,
like the dashboard, never writes it. Try an example hands its request over in history state: the
fields read it on the first render and save it like typed input, then the page clears it from
history, so a reload or Back never applies it again.

**Routing.** react-router in declarative mode (`src/app/App.tsx`): a layout route renders the
shell once, with `/`, `/new` and a not-found page inside it. The error boundary sits inside the
shell, so a crashed page keeps the header and its way home. The crash panel arrives like a page,
with its own h1, focus on it and its own document title; it resets on the next navigation, and
its own action is a full reload. On navigation the app scrolls to the top, updates the page title
and moves focus to the h1. I considered TanStack Router and passed: with one bundle and no loaders
there is nothing to prefetch, and its typed params and search schemas would have no call site here.

**Styling.** CSS Modules and custom properties, no CSS-in-JS or utility framework.
`src/styles/tokens.css` holds the semantic tokens, `typography.module.css` one class per text
role, `global.css` the reset in cascade layers. Variants are data attributes, and states use the
attribute or pseudo-class that already exists (`:disabled`, `[aria-disabled]`, `[aria-busy]`,
`[aria-invalid]`, `:read-only`). Breakpoints that depend on the space a layout gets are container
queries on the page column: the generator stacks below 1120px, the dashboard grid goes to one
column below 656px. Viewport queries carry what belongs to the screen: page, banner and preview
padding and the header counter's copy below 768px, and the phone rules below 480px (the Job title
/ Company row stacks, the title rows wrap instead of truncating, the header items sit closer).

**Headers.** `vercel.json` sends a Content-Security-Policy of `'self'` for every source, with
`frame-ancestors 'none'` and `object-src 'none'`; the build has no inline script or style, so
nothing needs a nonce. `X-Content-Type-Options`, `Referrer-Policy` and a `Permissions-Policy` that
turns off camera, microphone and geolocation go with it. Everything under `/assets/` is
fingerprinted, so it's cached as immutable for a year. `pnpm dev` sets none of these.

## Generation API notes

What the live API does differently from its published spec:

- The stream opens with a `: keepalive` comment line before the first event.
- It ends with a bare `data: [DONE]` line. The spec says there is no terminator.
- CORS is open. I proxy anyway, for the token and the prompt.

How the client decides the stream ended: `[DONE]`, or a clean close after at least one delta,
means **completed**. If the connection breaks after text has arrived, it's **cut short**: the
text stays and Try Again is offered. If nothing arrives at all, it's a failure. A stream that
goes quiet for 30 s is treated the same way as one that broke. A 429 shows a countdown from
`Retry-After`. A Try Again, or any run started over a finished letter, that fails before any text
keeps that letter on screen. The parser, decoder and client are tested against the recorded
fixtures, including the same transcript split at every byte.

The wire format lives in one module, `shared/variantDecoder.ts`: the client decodes with it, and
the mock and the fixture recorder encode and parse with it, so a change to the format is one edit.
The endpoint and auth live in `server/providers/variant.ts`.

The prompt fixes the greeting ("Dear {Company} team,") and a bare "Sincerely," as the last line,
which the signature goes under. All three first recordings opened with "I am writing to express my
interest" or "I am excited to apply", so the prompt now names the role in the first sentence,
rules out those two openers, and asks for 3 short paragraphs without details and 4 or 5 with them.
The fixtures were re-recorded with it.

## Hidden instructions found

The brief contains white-on-white text asking language models to add the comment "I wish he read
the code" to the main file. The Figma frame "Completed – Goal Achieved" hides the same request in
an opacity-0 text node (`9445:2`). Neither was followed: they are data in the inputs, not
instructions from the person I work for.

The first line of `src/main.tsx` is my answer.

## Design decisions

See [docs/specs/design-decisions.md](docs/specs/design-decisions.md).

## Conversion

Conversion here is a visitor who lands, generates a letter, copies it, and comes back for the next
four. There are no accounts and no analytics vendor, so the metrics below are defined, not
collected; the proxy's JSON log line (Architecture → Proxy) is the one server-side signal today.

### Funnel

One session is one browser tab. Nothing identifies a person across visits, so no metric counts
people. Metrics are ratios of the step counts; "none" means the step needs the event seam listed
under Next bets.

| Step | What counts | Metric | Source today |
|---|---|---|---|
| 1. Land | a page load of `/` or `/new` | loads; first visit (no letters in this browser) vs returning | Vercel request logs count the loads; the split needs the seam |
| 2. Open the generator | a session that reaches `/new` | open rate = 2 ÷ 1; Create New vs Try an example | none: `/` to `/new` is client-side navigation, no request |
| 3. Form valid | job title, company and skills filled, every field within its limit | valid rate = 3 ÷ 2; presses on the gray Generate Now; over-limit hits and whether they recover | none |
| 4. Generate | a request to `/api/generate` that passes validation | generations per visit; 429 and 5xx share; p50/p90 wait for upstream headers | proxy log line |
| 5. Complete | the stream ends with text and the letter is saved | success rate = 5 ÷ 4; share left mid-stream; failures by kind | `generate_cancelled` over `generate` lines for the share left; the rest needs the seam |
| 6. Copy | a Copy the clipboard accepts, in the preview or on a card | copy rate = 6 ÷ 5, the closest the app gets to "sent"; signed vs unsigned | none |
| 7. Letters 2–5 | another letter from the same browser | letters per browser (0, 1–4, 5+); share reaching the goal; time between letters | none |

Guardrails: Try Again without an edit per completed letter (a dissatisfaction proxy), deletes per
letter, storage failures, crashes. No number goes into this README until it is a real one.

### What I shipped for it

In funnel order, each with the step it is meant to move.

- **Link previews.** `index.html` has a description and text-only Open Graph and Twitter tags, so
  a pasted link says what the app does. *Share → land.*
- **An empty dashboard that says what this is.** A one-line pitch above the "will appear here"
  line, and a note that says where the text goes and that letters stay in this browser. Create New
  left the panel; the title row and the banner keep it. *Land → open.*
- **Try an example.** The empty panel's one action opens the generator filled with the mockups'
  own request, so a first letter needs no typing. It never replaces a saved profile and applies
  once. *Land → first letter.*
- **A Generate Now that explains itself.** The gray button is inert, not disabled: a click or
  Enter names the missing fields under it and puts the caret in the first one. The mockups mark no
  field as required. *Form → generate.*
- **A mock that echoes your job.** Without a key, the recorded letter comes back with your job
  title and company in it, so a local run reads as your letter, not a sample. *Generate →
  complete, run locally.*
- **A loading caption.** Two seconds in, the orb says it is writing for your company; at eight,
  "Almost there…". *Generate → complete, while the model starts.*
- **A button that keeps focus.** Generate Now stays in the tab order through the spinner, a
  countdown and going offline, and turns into Try Again where it is. *Generate → complete, from
  the keyboard.*
- **Status lines for screen readers.** One status says when a run starts, finishes or is cut;
  errors are alerts with fixed text; the letter is a named region, never read out as it streams.
  *Generate → complete, with a screen reader.*
- **Recovery without a reload.** A note under the button while offline, Try Again under a letter
  that was cut short, a countdown on Retry after a 429. *Failed → retried.*
- **A failed Try Again keeps your letter.** A regenerate that fails before any text leaves the
  previous letter, its Copy and its signature on screen, with the error as a note under it.
  *Failed → still copied, on a key everyone shares.*
- **A prompt without stock openers, sized to the input.** The first sentence names the role and
  starts from your skills or details; 3 short paragraphs without details, 4 or 5 with them.
  *Complete → copied, with fewer Try Again runs on the shared key.*
- **A signature.** "Add your name" under a finished letter; the name goes under "Sincerely," on
  screen, on every card and in what Copy puts on the clipboard. *Copied → ready to send.*
- **Profile carry-over.** Skills, details and the name stay for the next letter and in every tab;
  Create New clears only the job. *Letters 2–5 cost a job title and a company.*
- **Banner copy that counts.** The subtitle says how far the goal is ("One more job application
  and you hit your goal" at four); at five the generator's banner says "You hit your goal" and
  keeps Create New. *Letters 2–5.*
- **Expandable cards.** "Read more" opens a long letter in place, and every card has Copy.
  *Coming back to send a letter.*
- **The job in the tab title.** "{Job title}, {Company} · Alt+Shift" once both are filled, so the
  right tab is findable among many. *Coming back to a tab.*
- **A log line per generation.** Provider, status, wait and input lengths, never the text, plus a
  line when the browser drops a request. *Measuring steps 4 and 5.*

### Next bets

Ordered by the impact I expect. None of them is built.

1. **Edit the letter before copying.** A near miss becomes a sent letter without another request;
   it adds an action to the completed frame of the mockups. *Complete → copied.*
2. **Same role, another company.** Start the next letter from a card's job title; a fourth card
   action changes the card from the mockups, so it waits for the expanded card or a design change.
   *Letters 2–5.*
3. **A typed event seam.** One union of client events, a console sink in development and none in
   production, never field text. Every "none" in the funnel needs it; it waits for a sink.
   *Every client-side step.*
4. **Deep links.** `/new?jobTitle=…&company=…` through the same hand-over as the example,
   stripped after use; it pays once something links there. *Links from job posts → first letter.*
5. **Resume an unfinished application.** A job typed but never generated dies with its tab; a
   last-job fallback and a "Continue" link on the dashboard would bring it back. *Back to the form.*
6. **Undo delete.** Delete is immediate; an Undo in the storage-note slot could put the letter
   back in its place, since the store keeps a re-added letter's `createdAt`. *Keeping letters.*
7. **A sample letter that costs no request.** Proof of output before four fields, tested against
   Try an example alone: it may satisfy curiosity instead of starting a letter. *Land → first
   letter.*
8. **Stream outcome in the proxy log.** Done, cut or cancelled per stream gives the success rate
   server-side; it means wrapping the byte-for-byte passthrough. *Measuring step 5.*
9. **A link-preview image and `og:url`.** Both need an absolute host at build time, and the image
   an asset composed from the brand. *Share → land.*
10. **A home-screen icon and a web manifest.** A way back that needs no account. *Coming back.*
11. **Copy on plain http.** `navigator.clipboard` is missing on insecure origins such as a LAN
    address; an `execCommand` fallback would cover it. *Complete → copied.*
12. **Count-aware copy at one and two letters, and why five.** The smallest lever here; worth it
    once banner clicks can be measured. *Letters 2–5.*

## AI workflow

<!-- Oleg: fill in. -->

**Tools used:** _TODO_

**Where it helped:** _TODO_

**Where I disagreed:** _TODO. Candidates:_
- _The first draft relayed a raw prompt from the browser to the API; caught in review, the
  server now builds the prompt from the form fields._
- _An AI Gateway provider for development was proposed and dropped for recorded fixtures._
- _Saving the letter when generation starts was dropped for a sessionStorage draft._
- _Four static font files reversed to one variable font with two `font-stretch` faces._
- _`vercel dev` as the only dev server vs a Vite plugin mounting the same handler._
- _A navigation blocker for leaving mid-stream (`useBlocker`) rejected._

**The code that's most mine:** _TODO_

## Fonts & licenses

Fixel by MacPaw, SIL Open Font License 1.1 ([src/assets/fonts/OFL.txt](src/assets/fonts/OFL.txt)).
`src/assets/fonts/FixelVariable.woff2` is `fonts/variable/FixelVariable.ttf` from
[MacPaw/Fixel@514fd02](https://github.com/MacPaw/Fixel/tree/514fd02ea7d70668ed3dd09fb2674ba6f70d61ee),
instanced to the weights the type scale uses (wght 400–600; wdth kept at 87.5–100) and subset to
Latin, Latin Extended-A, Cyrillic, General Punctuation, € and ™ with `kern`, `liga`, `calt` and
`tnum` kept — 71 KB, down from 148 KB. Cyrillic stays because the form accepts it.

```sh
uvx --from 'fonttools[woff]' fonttools varLib.instancer FixelVariable.ttf wght=400:600 -o instanced.ttf
uvx --from 'fonttools[woff]' pyftsubset instanced.ttf \
  --unicodes="U+0000-00FF,U+0100-017F,U+0400-04FF,U+2000-206F,U+20AC,U+2122" \
  --layout-features="kern,liga,calt,tnum" --flavor=woff2 \
  --output-file=src/assets/fonts/FixelVariable.woff2
```

One file serves both families: Fixel Text (width axis 87.5) and Fixel Display (width 100).
