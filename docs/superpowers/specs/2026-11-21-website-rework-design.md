# Dawnage website rework: design

Date: 2026-11-21 · Status: awaiting approval

## Why

The current site is long and coaching-heavy: the homepage alone has 10 sections. A visitor should understand
what Dawnage is at first glance, with very little scrolling, and be hooked. So:

- **The homepage introduces Dawnage as a whole** (coaching, community, the Kochi studio, resources, the app).
  It does not sell coaching.
- **The coaching page becomes the sales page (VSL)**: video, client results, how it works, apply.
  "Apply for coaching" anywhere on the site leads there.
- **Less content everywhere.** Only what a prospect needs to see or hear. Simple, clean, aesthetic.

## Goals, non-goals, anti-goals

- Goal: someone landing on the homepage gets what Dawnage is within the first screen or two.
- Goal: every application is captured (Google Sheet) and starts a WhatsApp chat.
- Goal: the site goes from 20 pages to 8.
- Non-goal: changing the visual style. The "Soft Strength" look (soft grey, ink, orange `#FF4E00`, big rounded
  corners, Familjen Grotesk / Instrument Sans) stays, as in the user's mockups.
- Non-goal: prices on the site. Pricing is discussed on the consultation call.
- Anti-goal: walls of copy, long feature lists, unverified claims. Anything that makes the page feel busy is a failure
  even if it "works".

## Constraints

- Plain HTML/CSS/vanilla JS, no build step, relative links, header/footer repeated in every page (see `CLAUDE.md`).
- Dawnage AI (WhatsApp assistant) is discontinued. Remove every mention site-wide.
- The coaching app is for enrolled clients only and is not in the app stores yet. No download buttons or store badges.
- Missing content stays as the site's existing placeholders (`.ph` spans, `.photo-ph` boxes). Never stock photos of people.
- Browsers don't autoplay video with sound, so the hero loop is silent by design.

## Approaches considered

- **Rework the existing site in place (chosen).** Same files, same CSS system, same no-build setup.
  The mockups already use this look, and the designer keeps editing through Claude Code.
- Rebuild on a framework (Next/Astro): rejected. It's slower, gives visitors nothing new and breaks the "no build step" rule.
- Apply form: (A) WhatsApp hand-off only, (B) Google Sheet only, or **both (chosen by the user)**:
  save to a Sheet first, then open WhatsApp with the answers typed.

## Site map (8 pages)

| Page | What it is |
|---|---|
| `index.html` | Brand homepage (below) |
| `coaching.html` | VSL sales page with the apply form at the bottom (below) |
| `community.html` | Run Club + SENCS + team races and outings |
| `hq.html` (new) | Dawnage HQ, the in-person studio in Kakkanad, Kochi |
| `resources.html` | Free guides, ebooks and calculators on one page |
| `guide-sample-guide.html` | Stays as the template for individual guide articles |
| `about.html` | Founder, team, contact details |
| `404.html` | Updated header/footer only |

**Removed**, with redirects from their old URLs (in both `_redirects` and `vercel.json`):

| Old | Goes to |
|---|---|
| `dawnage-ai` | `/coaching` |
| `fat-loss`, `muscle-gain`, `body-recomposition`, `calisthenics` | `/coaching#goals` |
| `apply` | `/coaching#apply` |
| `faq` | `/coaching#faq` |
| `contact` | `/about#contact` |
| `run-club` | `/community#run-club` |
| `the-census` | `/community#sencs` |
| `guides` | `/resources#guides` |
| `ebooks` | `/resources#ebooks` (and `/store` now points here too) |
| `calculators` | `/resources#calculators` |
| `/membership` | `/coaching` (the plans section no longer exists) |

Update `sitemap.xml` to match.

## Header and footer (all pages except the coaching page)

- **Header:** logo · Coaching · Community · HQ · Resources · About · **[Apply for coaching →]**
  (the button goes to `coaching.html`). On the homepage the header sits over the video in white
  (`logo-white.png`) and turns solid on scroll.
- **Footer:** logo, "Do it anyway.", the same five links, WhatsApp, privacy policy, terms.
  This replaces today's long footer with its four columns.
- *My call:* "Client login" is removed. Clients now use the app, and the link was a placeholder anyway.

## Homepage: five screens

1. **Video hero (full screen).**
   - A silent 10–15s montage loop (Nipun talking to and training clients, the studio) fills the screen, with a soft dark wash so the text reads.
   - Copy: **"Do it anyway."** plus one line, *"Coaching, community and a studio in Kochi."* (wording is a proposal).
   - Buttons: **[▶ Watch the film]** and **[Apply for coaching →]**.
   - Video tag: `autoplay muted loop playsinline`, with a poster image. Phones get a vertical cut of the loop; wide screens get the landscape cut.
   - A small pause button sits in the corner (accessibility: moving video needs a way to stop it).
   - Reduced motion or Save-Data: show the poster only and don't load the video.
   - The loop is a self-hosted MP4 in `site/media/`, about 4 MB or less.
2. **What Dawnage is.** One short heading and four tiles, each one image, one line and a link:
   Coaching → `coaching.html`, Community → `community.html`, Dawnage HQ → `hq.html`, Resources → `resources.html`.
3. **The app (one quiet screen).**
   - Copy: "The Dawnage app." / "Your coach, in your pocket." / "Plan · Check-ins · Feedback" / "For Dawnage coaching clients."
   - One phone frame holding one screenshot (placeholder until the user sends screenshots).
   - No store badges.
4. **Proof in one line.** "[X] clients coached" with three client faces, linking "See the results →" to `coaching.html#results`.
   The number and photos stay placeholders until they're real.
5. **Founder line.** Nipun's portrait (`founder-face.webp`) and one sentence, then "About Dawnage →". Then the footer.

**Full film pop-up:** a native `<dialog>`. The YouTube/Vimeo embed (unlisted, `youtube-nocookie` if YouTube) loads only
when the pop-up opens, and playback stops when it closes (Esc, the close button or clicking the backdrop).
It shows a placeholder until the film URL is supplied.

**Removed from the homepage:** the 85/93/72/89% stats (unverified, deleted rather than moved), the goals grid, the
benefits list, how it works, the Dawnage AI section, the long resources/community block and the FAQ.

## Coaching page (VSL)

Based on the user's `Dawnage_Coaching_Page_Mockup_1`:

1. **Funnel header.** Logo (links home) · "Dawnage Coaching" · [Apply for Dawnage Coaching →]. There is no main menu,
   so the only ways forward are watching and applying.
2. **Hero.**
   - Chip: "1-to-1 online coaching".
   - Headline: "Lose fat. Get stronger. Make it work with your life."
   - One-line sub.
   - The **VSL video** (Malayalam): poster plus play button, played with sound in place (YouTube/Vimeo embed, loaded on click).
   - Below it: CTA, then the note "Our team reviews your application before reaching out."
3. **Our Heroes (`#results`).** A carousel of up to 6 client stories, one at a time: before/after photos,
   result and timeframe, starting point, coach's change. Arrows, dots, swipe on phones. Placeholders until the user supplies stories.
4. **What can we do for you (`#goals`).** 4 tiles: Fat loss, Muscle building, HYROX prep, Calisthenics.
   Body recomposition is dropped, as in the mockup.
5. **What coaching looks like.** 4 steps (you apply → call → coach builds your plan → coach reviews and adjusts)
   beside two app screenshots (weekly check-in, revised plan).
6. **Who we work with.** Dark panel with 3 criteria and "We review whether your goals fit the support we provide."
7. **FAQ (`#faq`).** The mockup's 5 questions and answers, with FAQPage structured data.
8. **Apply (`#apply`).** Fields:
   - Full name
   - WhatsApp number (+91 default)
   - Main goal: Fat loss / Muscle building / HYROX prep / Calisthenics / Something else
   - Biggest obstacle (text)
   - When would you like to start: Right away / In the next 2 weeks / Within a month / Just exploring
   - Button: [Submit application →]
9. **Minimal footer:** logo, "Do it anyway.", privacy policy, terms.

*My call:* the mockup's "What happens after you apply" section is dropped. It repeats steps 1–2 of
"What coaching looks like", and cutting it keeps the page shorter. The "Coaching in numbers / plans" section
from today's page is also gone.

## Apply form: what happens on Submit

1. Validate (name, a phone number of 10–15 digits, goal). Errors show inline as they do today.
2. **Save to Google Sheet.** POST the fields plus a timestamp and the page URL to a Google Apps Script web app
   (`fetch` with `mode: "no-cors"`, `keepalive: true`, so it completes even as the page navigates away).
   - The script appends one row per application.
   - The web-app URL lives in a `data-sheet` attribute on the form. If it's empty, this step is skipped and WhatsApp still opens.
   - A hidden honeypot field drops bot submissions.
3. **Open WhatsApp** (`wa.me/917907612261`) with the answers typed out, as the current form does.
4. Status message on the page: "Application received. WhatsApp is opening. Press send to start the chat."
   Plus a "WhatsApp didn't open? Tap here" link.
5. Under the button: "We store your details to review your application." with a link to the privacy policy.

Deliverable alongside the code: `docs/google-sheet-setup.md`, a short step-by-step for the Dawnage Google account.
It covers creating the Sheet, pasting the Apps Script, deploying it as a web app and pasting the URL into the form.

## Other pages (trimmed)

- **Community:** a short intro, then three blocks.
  - Run Club (`#run-club`): day, time, meeting point and a "Join on WhatsApp" link. Takes over the essentials from `run-club.html`.
  - SENCS (`#sencs`): placeholder text until the user confirms what it is and whether it replaces "The Census".
  - Team races and outings: photo placeholders.
- **HQ (new):** one photo, one line ("In-person coaching at our studio in Kakkanad, Kochi"), address, hours,
  a Google Maps link and "Book a visit on WhatsApp". All details are placeholders.
- **Resources:** one page with Free guides (cards, keeping the category filter), Ebooks and Calculators
  ("coming soon" for now). The "Courses" teaser is dropped.
- **About:** founder story, team, and a Contact block (`#contact`) with email, WhatsApp and the HQ address,
  absorbing `contact.html`. Shorter copy throughout.

## Site-wide cleanup

- Remove every Dawnage AI mention (pages, footer, FAQ answers, apply copy, page titles and meta descriptions).
- Update the `site.js` header comment and remove the `?plan=` pre-fill logic. Keep `?goal=` pre-fill, mapped to the new goal slugs.
- Remove CSS that's no longer used only if it's obviously dead. Otherwise leave `site.css` alone.
- Keep `noindex` on every page (still preview).
- Update `CLAUDE.md` (8 pages not 20, no Dawnage AI, no client login, apply form → Sheet + WhatsApp, `site/media/`
  for video) and the placeholder table in `README.md`, so future edits follow the new structure.
- Check every page at 390px wide and check for broken internal links.

## Waiting on the user (placeholders until then)

The hero loop (landscape and vertical cuts) and poster · the full film URL · the VSL video URL · app screenshots ·
up to 6 client stories with photos · "clients coached" number · 3 client faces · founder one-liner ·
HQ address/hours/photos · SENCS details · Google account access for the Sheet setup.

## Left to the builder

Exact spacing, the scroll behaviour of the transparent-to-solid header, carousel mechanics, poster frame choice and
image crops, as long as they match the existing Soft Strength style and stay simple.
