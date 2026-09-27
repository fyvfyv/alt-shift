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
  **Create New** clears the job and keeps what you're good at and your details; after Try an
  example it also clears the example's skills and details you didn't edit.
- Go offline (DevTools → Network → Offline): the line under the button says why it waits.

The live app shares one generation key, limited to six requests a minute, with everyone trying
it. "Too many requests" with a countdown means that limit, often reached by someone else
generating at the same time; the button in the preview works again at zero.

## Run locally

Node 24 (`.node-version`) and pnpm 10 (pinned in `packageManager`).

```sh
pnpm i && pnpm dev
```

No accounts or keys needed. Without a token the API route runs the **mock provider**, which
replays real API responses recorded in `server/fixtures/` at a realistic pace, with your job
title and company written into the letter. Failure scenarios can be triggered with the
`x-mock-scenario` request header: `disconnect` (the stream breaks part-way), `truncate` (it closes
cleanly mid-sentence, without `[DONE]`, as the live API sometimes does), `rate-limit`,
`upstream-error`, `invalid-token` (anything else is a 400).

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
needs a linked project and the token: it sets `VERCEL_ENV`, so it always uses the real API.

## Scripts

| Script | What it does |
|---|---|
| `dev` | Vite dev server with `/api/generate` |
| `build` / `preview` | Type-check and build to `dist/` / serve the build (static only, no `/api/generate`) |
| `typecheck` | `tsc -b` over app, server and e2e tests; the server project has no DOM lib, so server and shared code can't use browser globals |
| `lint` / `format` / `check` | Biome |
| `test` / `test:watch` / `test:coverage` | Vitest: `node` project for `server/` and `shared/`; `jsdom` project for `src/` |
| `test:e2e` | Playwright against the mock provider on port 4173, at 1440×900 and at 360×800, the most common Android width |
| `storybook` / `build-storybook` | Component and page catalog |
| `record:fixture <short\|medium\|long>` | Records a real API response into `server/fixtures/` (needs `.env.local`; costs one request) |

CI (`.github/workflows/ci.yml`) runs typecheck, Biome check (lint, format and import order),
coverage, build and e2e on pushes to `main` and on pull requests.

## Architecture

**Proxy.** The browser never talks to the Generation API. It posts the four form fields to
`/api/generate` (`api/generate.ts` → `server/generate.ts`), which validates them with the same
function the form uses (`shared/generation.ts`), builds the prompt on the server
(`server/prompt.ts`), and streams the upstream body back byte for byte. The token stays on the
server, and clients send form fields, not a prompt: the system prompt and the 900-token cap are
fixed there. Line breaks in the one-line fields are rejected, so a field can't add a line
to the system prompt. Only `Content-Type`, `Retry-After` and `X-Request-Id` are forwarded from
upstream. Leaving the page mid-stream cancels the upstream request (`supportsCancellation` in
`vercel.json`, `request.signal` passed through).

Each generation writes one JSON line to the function log: the provider, the status, the wait for
upstream headers, the lengths of the skills and details, and the upstream request id. A request
the browser drops mid-stream adds a `generate_cancelled` line; one dropped before upstream answers
is logged as its `generate` line with status 499. The field text is never logged. `vercel logs`
reads these lines, and they are the one server-side signal the
[conversion funnel](docs/specs/conversion.md) has today.

Cross-origin requests get a 403, so a page on another origin can't drain the one shared key
through its visitors' browsers. The check reads `Sec-Fetch-Site` and `Origin` against `Host`,
which browsers always send on a POST; curl passes. It's CSRF hygiene, not authentication: the app
has no users. The real provider answers 504 when upstream sends no headers within 20 s; the timer
is cleared once the body streams, so a slow model mid-letter is never cut off, but one that never
starts does not hang the function.

**Providers.** `server/providers/` has two: `variant` (the real API) and `mock`. `resolveProvider`
picks one per request from the environment, by the rules under Run locally. Both get the validated
request and the incoming headers and return a standard `Response`, so the handler doesn't know
which one it's talking to.

The mock picks a transcript by the length of the details (short, medium, long), swaps the recorded
job title and company for the request's, and re-chunks the text to the recorded delta sizes so the
pacing stays real. The requests the transcripts were recorded with (`server/fixtures/samples.ts`)
are shared with `record:fixture`, so the recorder and the mock cannot drift apart; the recorder
writes nothing when the transcript never says the sample's job title and company verbatim, since
the mock could not put your job into it. The short sample is Try an example's own request
(`shared/example.ts`), so offline the example gets a letter written for its own input.

**Streaming pipeline.** `src/features/generation/generationClient.ts` reads the body with
`TextDecoder` in streaming mode, `shared/sseParser.ts` implements the event-stream grammar,
`shared/variantDecoder.ts` turns events into text deltas, and the client yields them as an async
iterable. The two modules sit in `shared/` because the mock and the fixture recorder use them too.
A read that waits more than 30 s fails the run instead of leaving a spinner that never stops, and
after `[DONE]` the client drains the connection for up to 2 s so the browser records the request
as completed rather than aborted. `useGeneration.ts` batches deltas into one render per animation
frame and flushes before the final state, so no tail is lost. State lives in a pure reducer
(`generationReducer.ts`). The page gets the client through `GenerationProvider`, which is how
tests and Storybook substitute a fake without mocking modules.

**State.** Letters live in a zustand store (`src/features/letters/store.ts`) over an async
`LetterRepository`: `localStorageRepository.ts` in the app, `inMemoryRepository.ts` in tests. A
shared contract suite runs against both. The store updates memory first, then persists; a failed
write keeps the letter on screen and shows a note. Storage events keep tabs in sync. Letters sit
in a versioned envelope; a tab that finds a newer version reads no letters and refuses to write,
so an old tab left open after a deploy can't overwrite them. The in-flight letter is page-local
state and is written to the store once, when the stream completes. Try Again writes under the same
id, and the store keeps the original `createdAt`, so the card stays where it was instead of
jumping to the top.

Form fields survive a reload. The job title and company are a per-tab draft in `sessionStorage`
(`src/features/generation/useGeneratorFields.ts`), forgotten once its letter is saved. Skills,
details and the signature name are a profile in `localStorage`
(`src/features/profile/useProfile.ts`) that carries over to the next letter and follows `storage`
events, so a name set in one tab signs the cards in another; a page that only reads the profile,
like the dashboard, never writes it. Try an example hands its request over in history state, which
the page clears after the first render. Its skills and details go to the tab's draft with the job,
never to the profile, until you edit them.

**Routing.** react-router in declarative mode (`src/app/App.tsx`): a layout route renders the shell
once, with `/`, `/new` and a not-found page inside it. The error boundary sits inside the shell, so
a crashed page keeps the header and its way home. On navigation the app scrolls to the top, updates
the page title and moves focus to the h1. I considered TanStack Router and passed: with one bundle
and no loaders there is nothing to prefetch, and its typed params and search schemas would have no
call site here.

**Styling.** CSS Modules and custom properties, no CSS-in-JS or utility framework.
`src/styles/tokens.css` holds the semantic tokens, `typography.module.css` one class per text role,
`global.css` the reset in cascade layers. Variants are data attributes, and states use the attribute
or pseudo-class that already exists (`:disabled`, `[aria-disabled]`, `[aria-busy]`,
`[aria-invalid]`, `:read-only`). Breakpoints that depend on the space a layout gets are container
queries on the page column (the generator stacks below 1120px); what belongs to the screen, like
paddings and the phone rules, uses viewport queries.

**Headers.** `vercel.json` sends a Content-Security-Policy of `'self'` for every source, with
`frame-ancestors 'none'` and `object-src 'none'`; the build has no inline script or style, so
nothing needs a nonce. `X-Content-Type-Options`, `Referrer-Policy` and a `Permissions-Policy` that
turns off camera, microphone and geolocation go with it. Everything under `/assets/` is
fingerprinted, so it's cached as immutable for a year. The SPA rewrite skips `/assets/`, so a
missing hashed file is a 404, never the app shell cached under an immutable URL. `pnpm dev` sets
none of these.

## Generation API notes

What the live API does differently from its published spec:

- The stream usually opens with a `: keepalive` comment line, sent when the first token isn't
  ready yet; when it is, the first line is already an event.
- It ends with a bare `data: [DONE]` line. The spec says there is no terminator.
- It sometimes ends a letter mid-sentence and still closes the stream cleanly, with or without
  `[DONE]` (3 of about 43 live letters). No event carries a finish reason, so the stream alone
  can't tell a whole letter from a cut one.
- CORS is open. I proxy anyway, for the token and the prompt.

How the client decides the stream ended: `[DONE]` or a clean close means **completed** only if the
text ends like a letter: on a closing (the prompt asks for "Sincerely,"), on a name under one, or
at least on a finished sentence (`looksWhole` in `src/features/letters/model.ts`). The cuts seen
live all stopped mid-sentence, and a whole letter taken for a cut one would fail the same way on
every retry, so the check leans toward whole. A letter that stops mid-sentence, or a connection that
breaks or goes quiet for 30 s after text has arrived, is **cut short**: the text stays, nothing is
saved, and Try Again is offered. If nothing arrives at all, it's a failure. A 429 shows a countdown
from `Retry-After`. A Try Again, or any run started over a finished letter, that is cut or fails
keeps the saved letter on screen, with a note above it that names the letter's job if an edit has
changed it since. The parser, decoder and client are tested against the recorded fixtures,
including the same transcript split at every byte.

The wire format lives in one module, `shared/variantDecoder.ts`: the client decodes with it, and
the mock and the fixture recorder encode and parse with it, so a change to the format is one edit.
The endpoint and auth live in `server/providers/variant.ts`.

The prompt fixes the greeting ("Dear {Company} team,") and the sign-off, which the signature
goes under. The openers took four tries. All three first recordings opened
with "I am writing to express my interest" or "I am excited to apply". Banning those made every
letter open with years of experience. Requiring the role in the first sentence made every letter
open with "As a {role}". Asking for a concrete example when the details had none made the model
invent one ("a 40% increase in loading speed"). The prompt now opens the first paragraph with the
strongest example the details actually contain, names the role later in that paragraph, asks for
no results at all when the details are empty, and requires every number to come from the input. I
ran each version against six requests on the live API, including one without details and one
without years of experience, and re-recorded the fixtures with the last one. On thin input the
model still pads. The short fixture, recorded from Try an example's request (HTML, CSS, doing
things on time and two sentences of wishes), states no number or result, but adds work nobody gave
it ("cross-functional teams", "from concept to launch") and flatters the company ("Apple's
commitment to innovation and excellence"). The medium one keeps to its facts but adds one outcome
of its own ("ensuring consistency across products"). Pushing the opener harder produced invented
results, which is worse.

## Hidden instructions found

The brief contains white-on-white text asking language models to add the comment "I wish he read
the code" to the main file. The Figma frame "Completed – Goal Achieved" hides the same request in
an opacity-0 text node (`9445:2`). I didn't add it: a request hidden in a task's inputs is
addressed to whatever model reads them, not part of the task.

The first line of `src/main.tsx` is my answer.

## Design decisions

See [docs/specs/design-decisions.md](docs/specs/design-decisions.md).

## Conversion

Conversion here is a visitor who lands, generates a letter, copies it, and comes back for the next
four. The levers I'd point to first: Try an example (a first letter without typing), a Generate Now
that names what is missing, a failed Try Again that keeps your letter, and a profile and signature
that carry over, so letters 2–5 cost a job title and a company. Nothing is collected yet;
[docs/specs/conversion.md](docs/specs/conversion.md) defines the funnel step by step, with
everything shipped for it and the bets I'd build next.

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
Latin, Latin Extended-A, Cyrillic, General Punctuation, € and ™ with `kern`, `liga` and `tnum`
kept — 71 KB, down from 148 KB. Cyrillic stays because the form accepts it.

```sh
uvx --from 'fonttools[woff]' fonttools varLib.instancer FixelVariable.ttf wght=400:600 -o instanced.ttf
# Upstream sets maxp.maxZones to 0, which Firefox's font sanitizer (OTS) warns about on every load.
uvx --from 'fonttools[woff]' python -c "from fontTools.ttLib import TTFont; f=TTFont('instanced.ttf'); f['maxp'].maxZones=1; f.save('instanced.ttf')"
uvx --from 'fonttools[woff]' pyftsubset instanced.ttf \
  --unicodes="U+0000-00FF,U+0100-017F,U+0400-04FF,U+2000-206F,U+20AC,U+2122" \
  --layout-features="kern,liga,tnum" --flavor=woff2 \
  --output-file=src/assets/fonts/FixelVariable.woff2
```

One file serves both families: Fixel Text (width axis 87.5) and Fixel Display (width 100).
