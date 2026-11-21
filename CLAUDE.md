# Dawnage website: notes for Claude Code

This is a static website for Dawnage, founded by Nipun Fitness. It covers coaching, the community (Run Club, SENCS) and Dawnage HQ, the studio in Kochi.
The person asking for changes is a designer, not a developer. Make the change, then say in a sentence or two what changed and which pages. Don't ask them to run commands.

## How it's built
- Plain HTML, CSS and a little vanilla JS. **No frameworks, no npm, no build step.** Keep it that way.
- Everything that goes online is in `site/`. There are 8 pages:
  - `index.html`: brand homepage
  - `coaching.html`: coaching sales page with the apply form
  - `community.html`, `hq.html`, `resources.html`, `about.html`
  - `guide-sample-guide.html`: template for guide articles
  - `404.html`
- Links between pages are relative (`coaching.html#apply`) so the site works when opened by double-click.
  The only exception is `site/404.html`, which uses root paths (`/assets/…`) because it's served from any URL.
- **Header and footer:** the same header and footer are repeated in every page except `coaching.html`. **When you change either, change it in all of those pages** (including 404.html, whose paths start with `/`).
  - Nav: Coaching · Community · HQ · Resources · About, plus the "Apply for coaching" button, which goes to `coaching.html`.
  - `coaching.html` is a sales funnel with its own short header (logo + Apply) and footer, and no main menu. Keep it that way.
- Styles: `site/assets/site.css`. Colours, fonts and spacing are CSS variables at the top (`:root`). Reuse existing classes before adding new ones.
- Script: `site/assets/site.js` handles:
  - the mobile menu, scroll reveal and guide filters
  - the hero video, the film pop-up and the client-stories slider
  - the apply form
  - The small helper functions at the top (`window.Dawnage`) are unit-tested.

## Checks (run after changes)
- `python3 -m unittest tests/check_site.py -v` checks the page list, links and anchors, redirects, sitemap, the shared header/footer, and that removed things stay removed.
- `node --test tests/site.test.mjs` checks the apply form, WhatsApp message and video-link logic.

## Design rules (Soft Strength)
- Soft grey surfaces, ink text, brand orange `#FF4E00` (taken from the logo files) as the only accent. Fonts: Familjen Grotesk (headings), Instrument Sans (body).
- Text on orange is dark ink, never white. Never put small orange text on a light background (fails contrast).
- Big rounded corners (24–40px), pill buttons, generous spacing. Match the look of what's already there.
- **Keep content minimal.** Only what a visitor needs to see or hear. Propose cuts rather than additions.
- Keep it accessible: real `<button>`/`<a>`, alt text on images, labels on form fields, visible focus.

## Logo and brand files
- Header and footer use `assets/img/logo.png` (black DAWNAGE wordmark + falcon), 26px tall in the header, 24px in the footer.
  - `assets/img/logo-white.png` is the same lockup for dark backgrounds.
  - `assets/img/logo-mark.svg` is the orange falcon on its own; `assets/img/mark-white.svg` is the white falcon.
  - `favicon.svg`, `apple-touch-icon.png` and `og.png` use the falcon / lockup.
- Brand colours in the logo pack: orange `#FF4E00`, red `#FF002A`, black, white. The site uses orange only. Never recolour, stretch or redraw the logo.
- The original logo pack (M1–M4 lockups, 1–4 wordmarks, falcon .ai/.pdf) lives outside the site folder; regenerate from those if a new size is needed.

## Content
- Placeholders are `<span class="ph">[LIKE THIS]</span>`. When the real text arrives, replace the whole span with plain text.
- **Photos** go in `site/photos/` as WebP, at most 1200px wide (hero poster: up to 2000px).
  - A photo placeholder looks like `<div class="photo-ph" role="img" aria-label="…"><span class="ph-label">Photo · …</span></div>`.
  - To fill one, put the image inside it and drop `role`, `aria-label` and the label span:
    `<div class="photo-ph"><img src="photos/NAME.webp" alt="…" loading="lazy" decoding="async"></div>`.
    Keep any inline `style` and extra classes on the div (the image fills it).
  - For the first big photo on a page use `fetchpriority="high"` instead of `loading="lazy"`.
  - Cut-out portraits on a transparent background get the extra class `portrait`.
  - Write alt text that describes the photo.
- Photo look: mood/stock photos are black-and-white with softened blacks (see `site/photos/README.txt`); photos of real Dawnage people stay in colour.
- Never use stock photos for coaches, members, Run Club, SENCS, testimonials or before/after. Those slots stay as placeholders until real photos arrive.
- **Video:**
  - Homepage hero loop: `site/media/hero-loop.mp4` (landscape) and `site/media/hero-loop-vertical.mp4` (phones). Each should be 10–15s, H.264, no audio track, at most about 4 MB.
  - The poster (still frame) is the `poster` attribute on `<video class="hero-loop">` in `index.html`.
  - The full film and the coaching video are YouTube/Vimeo links (unlisted is fine) in a `data-film="…"` attribute:
    - the "Watch the film" button in `index.html`
    - the play button in `coaching.html`
  - Any normal share link works. While it's empty, visitors see "The film is coming soon."
- **Apply form** (`coaching.html#apply`): Submit saves the answers to a Google Sheet, then opens WhatsApp with the answers typed out.
  - The Sheet's web-app URL goes in `data-sheet="…"` on `<form id="apply-form">`. Setup steps: `docs/google-sheet-setup.md`.
  - Links can pre-select a goal: `coaching.html?goal=fat-loss#apply` (`fat-loss`, `muscle-building`, `hyrox`, `calisthenics`, `other`).
- The coaching app is for enrolled clients only and isn't in the app stores yet: no download buttons or store badges until it is.
- Dawnage AI (the old WhatsApp assistant) no longer exists. Don't mention it.
- WhatsApp: `https://wa.me/917907612261?text=…` (text URL-encoded).
- Legal links point to https://docs.dawnage.com/privacy-policy.pdf and https://docs.dawnage.com/tos.pdf.
- The coaching page has FAQPage structured data in a `<script type="application/ld+json">`. Keep it in sync when the FAQ changes.

## Preview vs launch
- Every page has `<meta name="robots" content="noindex">` while it's a preview. Remove that line from every page only when the person says it's launch day.
- Redirects: `site/_redirects` (Netlify) and `site/vercel.json` (Vercel). Keep both in sync. Add new pages to `site/sitemap.xml`.
- After changes, run the checks above and make sure the page still works at phone width (390px).
