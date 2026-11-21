# Dawnage Website Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 20-page coaching-heavy site into an 8-page brand site. It gets a silent video-loop homepage and a coaching page that works as a VSL funnel, whose apply form saves to a Google Sheet and then opens WhatsApp.

**Architecture:** Rework `site/` in place: plain HTML pages with a repeated header/footer, one stylesheet (`site/assets/site.css`) and one script (`site/assets/site.js`).
New behaviour lives in `site.js` as small pure helpers exposed on `window.Dawnage`, so Node can unit-test them. The DOM wiring calls those helpers.
A stdlib-only Python checker (`tests/check_site.py`) guards structure: page set, links, redirects, shared chrome and removed content.

**Tech Stack:** HTML, CSS, vanilla JS (ES5-style, like the existing `site.js`). Tests: Node 22 `node:test` + `vm`, and Python 3 `unittest` + `html.parser`. Nothing installed; no build step.

**Spec:** `docs/superpowers/specs/2026-11-21-website-rework-design.md`. Read it first. Section names below refer to it.

## Global Constraints

- No frameworks, no npm, no build step. Nothing is added inside `site/` except pages, CSS/JS edits, `site/media/` and photos.
- Links between pages are relative (`coaching.html#apply`); only `site/404.html` uses root paths (`/coaching.html`).
- Style is "Soft Strength": reuse existing classes and `:root` variables. Orange `#FF4E00` is the only accent. Text on orange is ink. Never put small orange text on a light background.
- Accessible: real `<button>`/`<a>`, labels on fields, alt text, visible focus, `prefers-reduced-motion` respected.
- Placeholders: text `<span class="ph">[LIKE THIS]</span>`; photos `<div class="photo-ph" role="img" aria-label="…"><span class="ph-label">Photo · …</span></div>`. Never stock photos of people.
- Every page keeps `<meta name="robots" content="noindex">`.
- WhatsApp number `917907612261`. Legal links: `https://docs.dawnage.com/privacy-policy.pdf`, `https://docs.dawnage.com/tos.pdf`.
- No mention anywhere of Dawnage AI, an AI assistant, "Client login", plans or prices.
- Copy is short. When in doubt, cut.
- Work on branch `website-rework`. Every commit message ends with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01TQ356Vcmpve5hdonumaeR5`.

## Review Focus

1. **The Sheet is unreachable, its URL is blank, or `fetch` throws or rejects.** WhatsApp must still open with the answers. Tested in Task 1 (`submitApplication`).
2. **Answers contain `&`, `#`, `?`, newlines, emoji or Malayalam.** The WhatsApp message must decode back exactly. Tested in Task 1.
3. **Numbers are typed as `+91 98765-43210`, `09876543210` or `9876543210`.** All of these are valid (10–15 digits); `12345` is not. Tested in Task 1.
4. **The film or VSL link is pasted in any common share format** (`youtu.be/ID?si=…`, `watch?v=ID&t=10s`, `/shorts/ID`, unlisted Vimeo `vimeo.com/ID/HASH`). Each must embed. An unknown or empty link shows a "coming soon" note, never a broken iframe. Tested in Task 1.
5. **An answer starts with `=`, `+`, `-` or `@`.** It must land in the Sheet as plain text, not a formula. Handled in the Apps Script and checked by the setup doc's test step (Task 4).

---

### Task 1: Pure helpers in `site.js` + Node tests

**Files:**
- Create: `tests/site.test.mjs`
- Modify: `site/assets/site.js` (add a helpers block at the top of the IIFE; delete the old "Apply form → WhatsApp" block at the end, which Task 4 replaces)

**Interfaces:**
- Produces, on `window.Dawnage`:
  - `validateApplication(data) -> object`: maps field name to error message; `{}` means valid.
    `data` is `{name, whatsapp, goal, obstacle, start, website}` (all strings).
  - `buildWhatsAppUrl(number: string, data) -> string`
  - `buildSheetBody(data, pageUrl: string, isoTime: string) -> string`: URL-encoded.
  - `submitApplication(data, deps) -> object`: returns the errors object.
    `deps` is `{waNumber, sheetUrl, pageUrl, now: () => string, fetch, navigate: (url) => void}`.
  - `embedUrl(shareUrl: string) -> string`: returns `""` when the link isn't recognised.
  - `shouldPlayLoop({reducedMotion: boolean, saveData: boolean}) -> boolean`
  - `storyIndex(scrollLeft: number, width: number, count: number) -> number`: 1-based, clamped to `1..count`.

- [ ] **Step 0: Branch and commit the spec**

```bash
cd /Users/manojthomas/Documents/DAWNAGE/DAWNWEBBRAND/dawnage-website
git switch -c website-rework
git add docs/superpowers && git commit -m "docs: website rework design and plan"   # + attribution lines
```

- [ ] **Step 1: Write the failing tests in `tests/site.test.mjs`**

Load `site/assets/site.js` with `vm.runInNewContext` inside a stub browser. The stub:
- `window` has `matchMedia: () => ({matches:false})`, `addEventListener(){}` and `location: {search:"", href:""}`.
- `document` has `querySelector: () => null`, `querySelectorAll: () => []`, `getElementById: () => null`, `addEventListener(){}` and `documentElement.classList.add(){}`.
- `URLSearchParams` and `navigator: {}` are passed in.

Then read `ctx.window.Dawnage` as `D`. Tests:

```js
test("valid application has no errors", () =>
  assert.deepEqual(D.validateApplication({name:"Asha", whatsapp:"+91 98765-43210", goal:"Fat loss"}), {}));
test("missing fields give the three messages", () => assert.deepEqual(
  D.validateApplication({name:" ", whatsapp:"12345", goal:""}),
  {name:"Please enter your name.",
   whatsapp:"Please enter your WhatsApp number with country code, e.g. +91 98765 43210.",
   goal:"Please choose your main goal."}));
test("phone formats", () => {
  for (const ok of ["09876543210","9876543210","+91 98765 43210","+919876543210"])
    assert.equal(D.validateApplication({name:"A", whatsapp:ok, goal:"Fat loss"}).whatsapp, undefined);
  assert.ok(D.validateApplication({name:"A", whatsapp:"1234567890123456", goal:"Fat loss"}).whatsapp); // 16 digits
});
test("whatsapp url round-trips tricky text", () => {
  const data = {name:"A & B #1?", whatsapp:"+91 98765 43210", goal:"HYROX prep",
                obstacle:"Line 1\nലൈൻ 2 💪", start:""};
  const u = new URL(D.buildWhatsAppUrl("917907612261", data));
  assert.equal(u.origin + u.pathname, "https://wa.me/917907612261");
  assert.equal(u.searchParams.get("text"),
    "Hi Dawnage, I'd like to apply for coaching.\nName: A & B #1?\nWhatsApp: +91 98765 43210\n" +
    "Goal: HYROX prep\nBiggest obstacle: Line 1\nലൈൻ 2 💪\nStart: -");
});
test("sheet body has every column", () => {
  const p = new URLSearchParams(D.buildSheetBody({name:"A", whatsapp:"9876543210", goal:"Fat loss",
    obstacle:"x", start:"Right away"}, "https://www.dawnage.com/coaching", "2026-11-21T10:00:00.000Z"));
  assert.deepEqual([...p.keys()], ["timestamp","name","whatsapp","goal","obstacle","start","page"]);
  assert.equal(p.get("start"), "Right away");
});
// submitApplication: fake fetch records calls; fake navigate records the url
test("saves then opens WhatsApp", ...)               // fetch called once: (sheetUrl, {method:"POST", mode:"no-cors", keepalive:true, headers:{"Content-Type":"application/x-www-form-urlencoded"}, body}); navigate called with buildWhatsAppUrl(...)
test("blank sheetUrl still opens WhatsApp", ...)     // fetch not called, navigate called
test("fetch throwing or rejecting still opens WhatsApp", ...) // fetch = () => { throw new Error() } and () => Promise.reject(new Error()); navigate called both times, no unhandled rejection
test("honeypot skips the save", ...)                 // data.website = "x" → fetch not called, navigate called
test("invalid data does nothing", ...)               // returns errors; fetch and navigate not called
test("embedUrl formats", () => {
  const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1";
  for (const s of ["https://youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
                   "https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"])
    assert.equal(D.embedUrl(s), yt);
  assert.equal(D.embedUrl("https://vimeo.com/123456789"), "https://player.vimeo.com/video/123456789?autoplay=1");
  assert.equal(D.embedUrl("https://vimeo.com/123456789/abcdef1234"), "https://player.vimeo.com/video/123456789?autoplay=1&h=abcdef1234");
  for (const bad of ["", "  ", "https://example.com/v.mp4", "not a url"]) assert.equal(D.embedUrl(bad), "");
});
test("shouldPlayLoop", () => {
  assert.equal(D.shouldPlayLoop({reducedMotion:false, saveData:false}), true);
  assert.equal(D.shouldPlayLoop({reducedMotion:true, saveData:false}), false);
  assert.equal(D.shouldPlayLoop({reducedMotion:false, saveData:true}), false);
});
test("storyIndex", () => {
  assert.equal(D.storyIndex(0, 300, 6), 1); assert.equal(D.storyIndex(290, 300, 6), 2);
  assert.equal(D.storyIndex(5000, 300, 6), 6); assert.equal(D.storyIndex(10, 0, 6), 1);
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `node --test tests/site.test.mjs`. Expected: FAIL, because `D` is undefined.

- [ ] **Step 3: Implement the helpers in `site/assets/site.js`**

- `validateApplication`: trims values. A phone number counts its digits only and needs 10–15.
- `buildWhatsAppUrl`: the message is exactly the six lines in the test, and an empty value becomes `-`.
- `submitApplication`: validate → if `website` is empty and `sheetUrl` is set, call `fetch` inside try/catch and add `.catch(() => {})` if it returns a promise → always call `navigate(buildWhatsAppUrl(waNumber, data))`. Never wait for the fetch.
- `embedUrl`: parse with `new URL` inside try/catch. YouTube IDs are 11 characters `[\w-]`.
- Update the file's header comment to: `mobile menu, scroll reveal, guide filters, hero video, film, stories, apply form`.

- [ ] **Step 4: Run and confirm they pass**

Run: `node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 5: Commit**: `feat: testable helpers for apply form, film embeds and stories`

---

### Task 2: Restructure to 8 pages: chrome, HQ page, redirects, sitemap, checker

**Files:**
- Create: `tests/check_site.py`, `site/hq.html`
- Delete: `site/{dawnage-ai,fat-loss,muscle-gain,body-recomposition,calisthenics,apply,faq,contact,run-club,the-census,guides,ebooks,calculators}.html`
- Modify: header and footer in `site/{index,coaching,community,resources,about,guide-sample-guide,404}.html`; `site/_redirects`; `site/vercel.json`; `site/sitemap.xml`; `site/assets/site.css` (footer)

**Interfaces:**
- Produces (Python, in `tests/check_site.py`): `SITE` (Path to `site/`); `pages() -> list[str]`; `links(page) -> list[str]`; `ids(page) -> set[str]`; `chrome(page, tag) -> str`.
  - `links` returns the `href`/`src`/`poster` values of `a`, `link`, `img`, `script`, `source` and `video`.
  - `ids` returns every `id` on the page.
  - `chrome` returns the outer HTML of the first `<header class="site-header…">` or `<footer…>`, with `aria-current="page"` removed.
  - Internal links are everything except `http(s):`, `mailto:`, `tel:` and `#…`. In `404.html` a leading `/` resolves against `SITE`.
- Produces (markup):
  - The standard header, copied once from `index.html` into every page except `coaching.html`. Nav links: Coaching `coaching.html`, Community `community.html`, HQ `hq.html`, Resources `resources.html`, About `about.html`. No "Home" item; the logo links home.
  - Header action: `<a class="btn btn-primary btn-sm" href="coaching.html">Apply for coaching…</a>`. The mobile menu has the same five links plus the same button. No "Client login".
  - Standard footer: logo, `<span class="tag">DO IT ANYWAY</span>`, one `.foot-links` row with the five links, the WhatsApp link, `.foot-bottom` (© 2026 Dawnage + legal nav).
  - `404.html` gets the same header and footer with `/`-prefixed paths.
  - `coaching.html` keeps the standard chrome for now; Task 4 replaces it.

- [ ] **Step 1: Write the failing checks in `tests/check_site.py`**

```python
EXPECTED = {"index.html","coaching.html","community.html","hq.html","resources.html",
            "guide-sample-guide.html","about.html","404.html"}
REDIRECTS = {"/dawnage-ai":"/coaching", "/fat-loss":"/coaching#goals", "/muscle-gain":"/coaching#goals",
  "/body-recomposition":"/coaching#goals", "/calisthenics":"/coaching#goals", "/apply":"/coaching#apply",
  "/faq":"/coaching#faq", "/contact":"/about#contact", "/run-club":"/community#run-club",
  "/the-census":"/community#sencs", "/guides":"/resources#guides", "/ebooks":"/resources#ebooks",
  "/calculators":"/resources#calculators", "/membership":"/coaching", "/store":"/resources#ebooks",
  "/index":"/"}
def test_page_set(self): self.assertEqual(set(pages()), EXPECTED)
def test_internal_links_resolve(self):  # every internal link's file part exists under SITE
def test_noindex_everywhere(self):      # '<meta name="robots" content="noindex">' in every page
def test_shared_header_footer(self):    # chrome(p,"header") identical across EXPECTED - {coaching,404};
                                        # same for "footer"; 404's equals it after stripping a leading "/" from paths
def test_nav_targets(self):             # nav-links hrefs in index.html == ["coaching.html","community.html","hq.html","resources.html","about.html"]
def test_redirects(self):               # _redirects lines parse to {src: dest} with code 301 == REDIRECTS;
                                        # vercel.json redirects (all "permanent": true) == REDIRECTS minus "/index"; keep "cleanUrls": true
def test_sitemap(self):                 # <loc> set == {https://www.dawnage.com/ + p without .html, "" for index} for EXPECTED - {404}
def test_no_removed_things(self):       # no page, site.js or sitemap contains: "Dawnage AI", "dawnage-ai", "AI assistant",
                                        # "client-login", "Client login", or any deleted filename
```

- [ ] **Step 2: Run and confirm they fail**

Run: `python3 -m unittest tests/check_site.py -v` (from `dawnage-website/`). Expected: FAIL on page set, redirects, sitemap and removed things.

- [ ] **Step 3: Delete the 13 pages, then put the new header and footer in the 7 kept pages and in `hq.html`**

- Footer CSS: add `.foot-links { display:flex; flex-wrap:wrap; gap:20px; }` (links styled like `.foot-col a`). Remove the `.foot-cols`/`.foot-col` rules.
- In page bodies, point every link to a deleted page at its new home using the `REDIRECTS` map, written as relative paths (`fat-loss.html` → `coaching.html#goals`).
- Delete the old `cta-band` "Do it anyway" sections; the header's Apply button replaces them.
- Remove remaining AI wording from kept bodies. Tasks 3–5 rewrite most of those bodies anyway, so do the minimum needed to pass.

- [ ] **Step 4: Build `site/hq.html`** (title `Dawnage HQ · Kochi`) with the copy below:

```
page-hero:  eyebrow "Dawnage HQ" · h1 "Train with us in Kochi." · lead "In-person coaching at our studio in Kakkanad, Kochi."
photo:      one wide photo-ph "Photo · Dawnage HQ studio"
grid-3 of contact-card: Address [HQ ADDRESS] · Hours [OPENING HOURS] · Map [GOOGLE MAPS LINK]   (placeholders as text, no dead links)
button:     btn-primary "Book a visit on WhatsApp" → wa.me/917907612261?text=Hi%20Dawnage%2C%20I%27d%20like%20to%20visit%20Dawnage%20HQ.
```

- [ ] **Step 5: Rewrite redirects and the sitemap to match `REDIRECTS` and `EXPECTED`**

- [ ] **Step 6: Run both suites and confirm they pass**

Run: `python3 -m unittest tests/check_site.py -v && node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 7: Commit**: `refactor: cut site to 8 pages, new header/footer, HQ page, redirects`

---

### Task 3: Homepage, five screens

**Files:**
- Modify: `site/index.html` (replace everything inside `<main>`, plus title/meta/og), `site/assets/site.css`, `site/assets/site.js`
- Create: `site/media/.gitkeep` (loop files go here later)
- Test: `tests/check_site.py`

**Interfaces:**
- Consumes: `Dawnage.shouldPlayLoop` and `Dawnage.embedUrl` from Task 1.
- Produces:
  - `<dialog class="film-dialog" id="film-dialog">`, opened by `button[data-film][data-film-mode="dialog"]`. `data-film=""` holds the share URL.
  - Film wiring in `site.js`, also used by Task 4 with `data-film-mode="inline"`:
    - On click it reads `embedUrl(btn.dataset.film)`.
    - If that returns `""`, it shows `<p class="film-soon">The film is coming soon.</p>`.
    - Otherwise it inserts `<iframe src=… title="Dawnage film" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen>`.
    - Dialog mode puts the iframe inside `#film-dialog .film-frame` and calls `showModal()`. The dialog's `close` event empties `.film-frame`, and so does a click on the backdrop.
    - Inline mode replaces the button's parent `.vsl-frame` contents.

- [ ] **Step 1: Add failing homepage checks**

```python
def test_home_hero_video(self):  # index has <video class="hero-loop"> with attrs muted, loop, playsinline, no src/<source>,
                                 # poster="photos/team.webp", data-src-wide="media/hero-loop.mp4",
                                 # data-src-tall="media/hero-loop-vertical.mp4"; a button.loop-toggle; h1 text "Do it anyway."
def test_home_film(self):        # button[data-film][data-film-mode=dialog] and dialog#film-dialog exist
def test_home_screens(self):     # exactly 5 <section> in <main>; text contains "The Dawnage app." and "clients coached";
                                 # links include coaching.html, community.html, hq.html, resources.html,
                                 # coaching.html#results, about.html; text has no "%" stat and no <details>
```

Run: `python3 -m unittest tests/check_site.py -v`. Expected: the 3 new checks FAIL.

- [ ] **Step 2: Write the five sections in `index.html`**, with this copy:

```
1 hero-video  (full viewport: height 100svh, min 560px; header overlays it, see CSS below)
  <video class="hero-loop" muted loop playsinline preload="none" poster="photos/team.webp" aria-hidden="true" data-src-wide=… data-src-tall=…>
  dark wash · h1.h-hero "Do it anyway." · p.lead "Coaching, community and a studio in Kochi."
  btn-row: [▶ Watch the film] (btn-primary, data-film="" data-film-mode="dialog" aria-haspopup="dialog")
           [Apply for coaching →] (btn-light → coaching.html)
  button.loop-toggle bottom-right, aria-label "Pause background video" ⇄ "Play background video", aria-pressed
2 eyebrow "Dawnage" · h2 "Explore Dawnage." · grid-4 of the existing .goal card:
  Coaching — "1-to-1 online coaching with a dedicated coach." → coaching.html (img photos/goal-recomp.webp, existing alt)
  Community — "Dawnage Run Club, SENCS, team races and outings." → community.html (photo-ph "Photo · Run Club")
  Dawnage HQ — "In-person coaching at our studio in Kakkanad, Kochi." → hq.html (photo-ph "Photo · Dawnage HQ studio")
  Resources — "Free guides, ebooks and calculators." → resources.html (img photos/guide-1.webp, existing alt)
3 .split: h2 "The Dawnage app." · p.lead "Your coach, in your pocket." · p "Plan · Check-ins · Feedback" ·
  p.small.muted "For Dawnage coaching clients." | .phone frame holding photo-ph "Screenshot · Dawnage app"
4 card-lg row: big number "<span class="ph">[X]</span> clients coached" · three 56px round .face photo-ph ("Photo · client") ·
  link-arrow "See the results" → coaching.html#results
5 founder row: img photos/founder-face.webp (72px round) · h2.h-4 "Built by Nipun and the Dawnage team." · link-arrow "About Dawnage" → about.html
```

- Title: `Dawnage · Do it anyway.`
- Meta description and og:description: `1-to-1 online coaching, the Dawnage Run Club and community, and an in-person studio in Kochi.`
- Remove the Organization JSON-LD `contactPoint` only if it mentions AI. It doesn't, so keep it.

- [ ] **Step 3: Add the CSS** (new rules grouped under `/* home */`)

- `body.home .site-header` is absolutely positioned over the hero (`position:absolute; inset-inline:0; top:0`). The pill nav stays as it is.
- `.hero-video`: `position:relative; overflow:hidden; border-radius:0 0 40px 40px`. The video uses `object-fit:cover` and fills the section; the poster shows while it loads.
- The wash is a `linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.65))`, with white text on top.
- `.phone`: a 300px-wide, 9/19.5 rounded-44px ink frame with 10px padding.
- `.face`: a 56px circle with overlap `margin-left:-12px`.
- Check that nothing overflows at 390px.

- [ ] **Step 4: Wire `site.js`**

- **Hero loop.** Read `reducedMotion` from `matchMedia("(prefers-reduced-motion: reduce)")` and `saveData` from `navigator.connection && navigator.connection.saveData`. If `shouldPlayLoop` says yes:
  - Set `video.src` from `data-src-tall` when `matchMedia("(max-aspect-ratio: 3/4)")` matches, otherwise `data-src-wide`, then call `play()` and catch any error.
  - `video.onerror` leaves the poster in place and hides the toggle.
- If the loop doesn't play, hide `.loop-toggle`.
- **Film wiring:** as described in the Interfaces block. Esc closes the dialog natively.

- [ ] **Step 5: Run both suites and confirm they pass**

Run: `python3 -m unittest tests/check_site.py -v && node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 6: Check it in a browser**

Open `site/index.html` in Chrome and check:
- The poster shows, because the loop file is missing.
- "Watch the film" opens the dialog with "The film is coming soon."
- Esc and a backdrop click both close it.
- Paste a YouTube URL into `data-film` temporarily: it plays, and closing stops the sound.
- Reduced motion in DevTools: no request to `media/`.

- [ ] **Step 7: Commit**: `feat: brand homepage with video hero, film dialog and app glimpse`

---

### Task 4: Coaching page as VSL, apply form to Sheet + WhatsApp

**Files:**
- Modify: `site/coaching.html` (full rewrite), `site/assets/site.css`, `site/assets/site.js`
- Create: `docs/google-sheet-setup.md`
- Test: `tests/check_site.py`

**Interfaces:**
- Consumes: `Dawnage.submitApplication`, `Dawnage.storyIndex`, the film wiring (inline mode) from Tasks 1 and 3.
- Produces:
  - `form#apply-form` with `data-wa="917907612261"` and `data-sheet=""` (the client pastes the Apps Script URL here).
  - Fields:
    - `name` (`#f-name`)
    - `whatsapp` (`#f-wa`, value `+91 `)
    - `goal` (`select#f-goal`, options carry `data-slug`)
    - `obstacle` (`textarea#f-obstacle`)
    - `start` (`select#f-start`)
    - honeypot `website` (in an `aria-hidden` `.sr-only` div, `tabindex="-1" autocomplete="off"`)
  - Each field is wrapped in `.field[data-field=…]` with `.err` for errors, as on the current form.
  - `#apply-status` (`role="status"`, hidden) containing `a#apply-wa-link`.

- [ ] **Step 1: Add failing checks**

```python
def test_coaching_funnel(self):  # coaching.html has no .nav-links and no .menu-btn; header has a link to index.html and to #apply;
                                 # ids ⊇ {"results","goals","faq","apply","apply-form","apply-status"};
                                 # no link to community/hq/resources/about pages except legal + index
def test_coaching_form(self):    # form fields named name, whatsapp, goal, obstacle, start, website; goal options ==
                                 # ["", "Fat loss","Muscle building","HYROX prep","Calisthenics","Something else"];
                                 # start options == ["", "Right away","In the next 2 weeks","Within a month","Just exploring"];
                                 # form has data-wa="917907612261" and a data-sheet attribute; every visible input/select/textarea has a <label for>
def test_coaching_sections(self):# exactly 7 <section> in <main> (hero, results, goals, how, who, faq, apply); 6 article.story;
                                 # text has no "What happens after you apply", no "Plans", no "₹"
def test_faq_jsonld(self):       # JSON-LD FAQPage questions == the 5 <summary> texts, in order
```

Run: `python3 -m unittest tests/check_site.py -v`. Expected: the new checks FAIL.

- [ ] **Step 2: Rewrite `coaching.html`** using the copy below, verbatim from the user's mockup. Title: `Dawnage Coaching · Apply`.

```
funnel header: logo → index.html · "Dawnage Coaching" · btn-primary btn-sm "Apply for Dawnage Coaching" → #apply
hero (centred): chip "1-to-1 online coaching" · h1 "Lose fat. Get stronger. Make it work with your life."
  p "A dedicated coach, personalised training and nutrition, and regular check-ins through the Dawnage app."
  .vsl-frame (16/9, radius 32px, dark): poster photo-ph.dark "Inside Dawnage Coaching · Malayalam coaching video" +
    centred round orange play button[data-film=""][data-film-mode="inline"] aria-label "Play the Dawnage Coaching video"
  btn-primary "Apply for Dawnage Coaching" → #apply · p.small.muted "Our team reviews your application before reaching out to schedule a call."
#results: h2 "Our Heroes." · p "See where they started, what changed and what they achieved."
  [data-carousel]: .stories-track (scroll-snap-type:x mandatory; overflow-x:auto) with 6 article.story, each:
    2 photo-ph "Before photo"/"After photo" · badge "Featured client story" · h3 [CLIENT RESULT AND TIMEFRAME]
    dl: "Starting point" [THE OBSTACLE THE CLIENT WAS FACING] · "Coach's change" [THE ADJUSTMENT THAT MADE A DIFFERENCE]
  controls: button "Previous story" / "Next story" (round, arrow icons) · p aria-live=polite "<span data-current>1</span> / 6 client stories"
#goals: h2 "What can we do for you?" · grid-4 .card each with a short orange rule:
  Fat loss — Build eating and training habits you can sustain around your life.
  Muscle building — Train with a plan built to help you get stronger and build muscle.
  HYROX prep — Prepare for race day with running, strength and station practice.
  Calisthenics — Build bodyweight strength and work towards the skills you want.
how: card-lg .split: h2 "What coaching looks like." · p "Your plan, check-ins and feedback live in the Dawnage app."
  ol of 4 numbered steps:
    You apply — Tell us what you want to achieve and what's getting in the way.
    We get to know you on a call — We talk through your goals, routine and starting point.
    Your coach builds your plan — Your plan is built around your lifestyle and your goals.
    Your coach reviews and adjusts — Your coach updates the plan as you check in and progress.
  btn "Apply for Dawnage Coaching" → #apply | two .phone frames: "Screenshot · Weekly check-in", "Screenshot · Your revised plan"
who: .night split: h2 "Who we work with." · p "People ready to lose fat, get stronger and build a routine they can stick to." |
  orange-dot list: You're willing to make changes to how you eat. / You're ready to make time for regular training. /
  You can give your coach honest feedback. · rule · "We review whether your goals fit the support we provide."
#faq: faq-wrap: h2 "Questions before you apply?" | 5 <details> (existing .faq markup):
  Can I join as a beginner? — Yes. Tell us where you're starting from so we can assess what support makes sense for you.
  What if my schedule changes every week? — Tell your coach when your availability changes. They can adjust your plan around the time you have to train.
  Do I need a gym? — Tell us what equipment you have access to. We'll discuss what setup makes sense for your goal on the consultation call.
  How does my coach support me through the app? — You'll find your plan in the app. Your coach reviews your check-ins, gives feedback and adjusts the plan as you progress.
  What happens on the consultation call? — We'll talk through your goals and routine, see whether coaching fits, and discuss your options and pricing.
#apply: card-lg split: h2 "Apply for Dawnage Coaching." · p "Tell us where you are now and what you'd like to work on. We'll review your application and reach out if it's a fit." |
  form (labels: Full name · WhatsApp number · Main goal · Biggest obstacle · When would you like to start?;
  placeholders "Your name", "What has made progress difficult so far?", select prompts "Choose your main goal" / "Choose your preferred timing")
  submit btn-primary btn-block "Submit application"
  p.form-note "We store your details to review your application. Privacy policy" (link)
  #apply-status: "Application received. WhatsApp is opening. Press send to start the chat. WhatsApp didn't open? <a id=apply-wa-link>Tap here</a>."
funnel footer: logo · "Do it anyway." · legal links
```

- JSON-LD: put the FAQPage block (the 5 Q&As) in `<head>`.
- Goal option slugs: `fat-loss`, `muscle-building`, `hyrox`, `calisthenics`, `other`.

- [ ] **Step 3: Add the CSS**

- The funnel header reuses `.nav`, with a centred label in `.small`.
- `.vsl-frame`, plus `.vsl-play`: a 72px orange circle with an ink icon.
- `.stories-track`: flex. Each `.story` is `flex:0 0 100%; scroll-snap-align:start`, with photos side by side on desktop and stacked under 720px.
- `.phone` comes from Task 3.

- [ ] **Step 4: Wire `site.js`**

**Form:**
- Pre-select the goal from `?goal=<slug>`.
- On submit, call `Dawnage.submitApplication(data, {waNumber: form.dataset.wa, sheetUrl: form.dataset.sheet.trim(), pageUrl: location.href, now: () => new Date().toISOString(), fetch: window.fetch.bind(window), navigate: (u) => { link.href = u; status.hidden = false; location.href = u; }})`.
- Show the returned errors in `.err` and focus the first invalid field.

**Carousel:**
- Prev and next call `track.scrollBy({left: ±track.clientWidth})`.
- A passive scroll listener sets `[data-current]` from `storyIndex`, and disables prev on story 1 and next on story 6.
- Arrow keys on the focused track work natively (`tabindex="0"`, `aria-label="Client stories"`).

**VSL:** inline film mode from Task 3.

- [ ] **Step 5: Write `docs/google-sheet-setup.md`**, in plain words for a non-developer:

1. In the Dawnage Google account, create a Sheet named **Dawnage applications** with a tab **Applications** and header row `Time | Name | WhatsApp | Goal | Biggest obstacle | Start | Page`.
2. Extensions → Apps Script. Paste the script below and save.
3. Deploy → New deployment → Web app. Execute as **Me**, access **Anyone**. Copy the URL.
4. Ask Claude Code: "Put this Sheet URL in the apply form: …". This fills `data-sheet` in `coaching.html`.
5. Test it: submit once with the name `=1+1`. The new row must show `=1+1` as text, not `2`.

```js
function doPost(e) {
  var p = e.parameter, clean = function (v) { v = String(v || ""); return /^[=+\-@]/.test(v) ? "'" + v : v; };
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Applications")
    .appendRow([p.timestamp, p.name, p.whatsapp, p.goal, p.obstacle, p.start, p.page].map(clean));
  return ContentService.createTextOutput("ok");
}
```

- [ ] **Step 6: Run both suites and confirm they pass**

Run: `python3 -m unittest tests/check_site.py -v && node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 7: Check it in a browser**

- An empty submit shows three inline errors.
- A valid submit with `data-sheet=""` opens a `wa.me` URL with the six-line message.
- With `data-sheet="https://example.invalid/x"`, WhatsApp still opens.
- The carousel counter goes 1 → 6, and the buttons disable at each end.
- The VSL play button shows "The film is coming soon."

- [ ] **Step 8: Commit**: `feat: coaching VSL page, apply form saves to Sheet then opens WhatsApp`

---

### Task 5: Trim Community, Resources and About

**Files:**
- Modify: `site/community.html`, `site/resources.html`, `site/about.html`, `site/guide-sample-guide.html` (body links only)
- Test: `tests/check_site.py`

- [ ] **Step 1: Add failing checks**

```python
def test_anchor_targets_exist(self):  # ids: community ⊇ {"run-club","sencs"}; resources ⊇ {"guides","ebooks","calculators"};
                                      # about ⊇ {"contact","team"}
def test_no_census(self):             # no page contains "Census" (SENCS replaces it)
def test_trimmed(self):               # <section> count in <main>: community ≤ 4, resources ≤ 4, about ≤ 3;
                                      # resources text has no "Courses"
```

Run: `python3 -m unittest tests/check_site.py -v`. Expected: the new checks FAIL.

- [ ] **Step 2: Community**

- Keep the existing page-hero h1 "Training is better together." with a one-line lead.
- `#run-club`: reuse `.run-card` with "Dawnage Run Club", `[DAY · TIME · MEETING POINT]` and the link "Join on WhatsApp" → `wa.me/917907612261?text=Hi%20Dawnage%2C%20I%27d%20like%20to%20join%20the%20next%20Run%20Club%20run.`
- `#sencs`: reuse `.census-card` with h3 "SENCS by Dawnage" and `[ONE LINE ON WHAT SENCS IS]`, no link.
- "Team races and outings": `.photo-grid` with 3 photo-ph.
- Drop everything else, including "What's on".

- [ ] **Step 3: Resources**

- Keep the page-hero h1 "Learn the why behind your plan."
- `#guides`: guide cards and filter chips, moved from the deleted `guides.html` (from git history).
- `#ebooks`: the two ebook cards with `photos/ebook-1.webp` and `photos/ebook-2.webp`, from the deleted `ebooks.html`.
- `#calculators`: one card, "Calculators are coming.", with the four names as `.chip-lg`: Calories (BMR and TDEE), Macros, Daily protein, Body fat estimate.
- No Courses.

- [ ] **Step 4: About**

- Keep the page-hero, the founder block and `#team`. Drop the philosophy section.
- `#contact`: keep the contact cards, and add a link "Visit Dawnage HQ" → `hq.html`.
- Copy no longer than it is now.

- [ ] **Step 5: Run both suites and confirm they pass**

Run: `python3 -m unittest tests/check_site.py -v && node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 6: Commit**: `refactor: trim community, resources and about`

---

### Task 6: Anchor integrity, docs, phone-width check

**Files:**
- Modify: `tests/check_site.py`, `CLAUDE.md`, `README.md`, `site/photos/README.txt` (photo names for the new slots)

- [ ] **Step 1: Add a failing check**

```python
def test_fragments_resolve(self):  # every internal link "page.html#frag" (and "#frag" on the same page) has id frag in that page;
                                   # every REDIRECTS destination "/page#frag" resolves the same way ("/" → index.html)
```

Run: `python3 -m unittest tests/check_site.py -v`. Expected: it passes or names the broken anchors. Fix any it names.

- [ ] **Step 2: Update `CLAUDE.md`**

- 8 pages, not 20.
- The header/footer rule now reads "every page except `coaching.html`, which has its own funnel header and footer".
- Remove the client-login and FAQ-page notes.
- Add `site/media/` for video: `hero-loop.mp4` landscape and `hero-loop-vertical.mp4`, each ≤ 4 MB, H.264, no audio.
- Add the film and VSL `data-film` URLs, and `data-sheet` with a pointer to `docs/google-sheet-setup.md`.
- Add the test commands.

- [ ] **Step 3: Update the `README.md` placeholder table and `site/photos/README.txt`**

- Remove the rows that no longer apply: plans, Dawnage AI, client login, the 85/93% stats.
- Add these rows: hero loop and poster, film URL, VSL URL, app screenshots, client stories, clients-coached number, HQ details, SENCS.

- [ ] **Step 4: Screenshot every page at phone width**

```bash
for p in index coaching community hq resources about guide-sample-guide; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
    --window-size=390,3000 --screenshot="$SCRATCH/$p-390.png" "file://$PWD/site/$p.html"; done
```

`$SCRATCH` is the session scratchpad. Open each PNG and check:
- no content is cut off at the right edge;
- the header fits;
- the hero text reads over the poster;
- the carousel shows one story.

Repeat at `--window-size=1440,3000`.

- [ ] **Step 5: Run both suites and confirm they pass**

Run: `python3 -m unittest tests/check_site.py -v && node --test tests/site.test.mjs`. Expected: all pass.

- [ ] **Step 6: Commit**: `docs: update CLAUDE.md, README and photo list for the new site`
