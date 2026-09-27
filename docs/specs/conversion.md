# Conversion

Conversion here is a visitor who lands, generates a letter, copies it, and comes back for the next
four. There are no accounts and no analytics vendor, so the metrics below are defined, not
collected; the proxy's JSON log line ([README → Architecture](../../README.md#architecture)) is
the one server-side signal today.

## Funnel

One session is one browser tab. Nothing identifies a person across visits, so no metric counts
people. Metrics are ratios of the step counts; "none" means the step needs the event seam listed
under Next bets.

| Step | What counts | Metric | Source today |
|---|---|---|---|
| 1. Land | a page load of `/` or `/new` | loads; first visit (no letters in this browser) vs returning | Vercel request logs count the loads; the split needs the seam |
| 2. Open the generator | a session that reaches `/new` | open rate = 2 ÷ 1; Create New vs Try an example | none: `/` to `/new` is client-side navigation, no request |
| 3. Form valid | job title, company and skills filled, every field within its limit | valid rate = 3 ÷ 2; presses on the gray Generate Now; over-limit hits and whether they recover | none |
| 4. Generate | a request to `/api/generate` that passes validation | generations per visit; 429 and 5xx share; p50/p90 wait for upstream headers | proxy log line |
| 5. Complete | the stream ends with text and the letter is saved | success rate = 5 ÷ 4; share left mid-stream; failures by kind | `generate_cancelled` over 200 `generate` lines for the share left mid-stream; 499 `generate` lines for the share left while waiting; the rest needs the seam |
| 6. Copy | a Copy the clipboard accepts, in the preview or on a card | copy rate = 6 ÷ 5, the closest the app gets to "sent"; signed vs unsigned | none |
| 7. Letters 2–5 | another letter from the same browser | letters per browser (0, 1–4, 5+); share reaching the goal; time between letters | none |

Guardrails: Try Again without an edit per completed letter (a dissatisfaction proxy), deletes per
letter, storage failures, crashes. No number goes into these docs until it is a real one.

## What I shipped for it

In funnel order; the rules behind each are in [design-decisions.md](design-decisions.md).

- **Link previews**: a description and text-only Open Graph tags in `index.html`. *Land.*
- **An empty dashboard that pitches the product**, with Try an example as its one action and a
  note on where the text goes. *Land → open.*
- **Try an example**: the mockups' own request, so a first letter needs no typing; its bio is
  never saved as yours. *Land → first letter.*
- **A Generate Now that names what is missing** and puts the caret there. *Form valid → generate.*
- **A loading caption** that names the company, then "Almost there…", and a "Writing…" line under the streaming text that turns into "Still writing…" when the stream pauses; both shimmer. *Generate → complete.*
- **Recovery without a reload**: the offline note, Try Again under a cut letter, the countdown
  after a 429, and a failed or cut Try Again that keeps your saved letter and its Copy on screen.
  *Generate → complete, on a key everyone shares.*
- **A prompt without stock openers**, told to state no number or result you didn't give.
  *Complete → copy, with fewer retries.*
- **A signature**, added once, on every letter and every copy. *Copy.*
- **Profile carry-over**: skills, details and the name stay, so the next letter costs a job title
  and a company. *Letters 2–5.*
- **Banner copy that counts** down to the goal, and Read more, which opens a card's whole letter
  with its Copy. *Letters 2–5.*
- **The job in the tab title**, so the right tab is findable. *Letters 2–5.*

## Next bets

Ordered by the impact I expect. None of them is built.

1. **Edit the letter before copying**: a near miss becomes a sent letter without another request.
   *Complete → copy.*
2. **Same role, another company**: start the next letter from a card's job title; it adds a card
   action the mockups don't have. *Letters 2–5.*
3. **A typed event seam**: one union of client events, a console sink in development, never field
   text. Every "none" in the funnel needs it. *Every client-side step.*
4. **Deep links**: `/new?jobTitle=…&company=…` through the example's hand-over. *Job posts → first
   letter.*
5. **Resume an unfinished application**: a job typed but never generated dies with its tab; a
   "Continue" link on the dashboard would bring it back. *Back to the form.*

Smaller, not built either: Undo after Delete, a sample letter that costs no request, the stream
outcome in the proxy log, a link-preview image, a web manifest.
