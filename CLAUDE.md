# Dawnage website: notes for Claude Code

This is a finished static website for Dawnage (online transformation coaching, founded by Nipun Fitness).
The person asking for changes is a designer, not a developer: make the change, then say in a sentence or two what changed and which pages. Don't ask them to run commands.

## How it's built
- Plain HTML, CSS and a little vanilla JS. **No frameworks, no npm, no build step.** Keep it that way.
- Everything that goes online is in `site/`. Pages are flat files: `site/index.html`, `site/coaching.html`, …
- Links between pages are relative (`coaching.html`, `apply.html#…`) so the site works when opened by double-click.
  The only exception is `site/404.html`, which uses root paths (`/assets/…`) because it's served from any URL.
- The header and footer are repeated in every page. **When you change either, change it in all 20 pages** (including 404.html, whose paths start with `/`).
- Styles: `site/assets/site.css`. Colours, fonts and spacing are CSS variables at the top (`:root`). Reuse existing classes before adding new ones.
- Script: `site/assets/site.js` (mobile menu, scroll reveal, guide filters, Apply form → WhatsApp).

## Design rules (Soft Strength)
- Soft grey surfaces, ink text, orange `#E35A33` as the only accent. Fonts: Familjen Grotesk (headings), Instrument Sans (body).
- Text on orange is dark ink, never white. Never put small orange text on a light background (fails contrast).
- Big rounded corners (24–40px), pill buttons, generous spacing. Match the look of what's already there.
- Keep it accessible: real `<button>`/`<a>`, alt text on images, labels on form fields, visible focus.

## Content
- Placeholders are `<span class="ph">[LIKE THIS]</span>`. When the real text arrives, replace the whole span with plain text.
- Photos go in `site/photos/`. A photo placeholder looks like
  `<div class="photo-ph" role="img" aria-label="…"><span class="ph-label">Photo · …</span></div>`.
  Replace it with `<img src="photos/NAME.jpg" alt="…" class="photo-ph" style="object-fit:cover;padding:0" loading="lazy">`,
  keeping any inline `style` height or radius from the placeholder. Keep descriptive alt text.
- WhatsApp: `https://wa.me/917907612261?text=…` (text URL-encoded).
- Legal links point to https://docs.dawnage.com/privacy-policy.pdf and https://docs.dawnage.com/tos.pdf.
- Client login link is a placeholder: `#client-login-url-needed`. Replace it in every page when the real URL is known.
- FAQ page has FAQPage structured data in a `<script type="application/ld+json">`; keep it in sync when answers change
  (only include questions with real answers).

## Preview vs launch
- Every page has `<meta name="robots" content="noindex">` while it's a preview. Remove that line from every page only when the person says it's launch day.
- Redirects: `site/_redirects` (Netlify) and `site/vercel.json` (Vercel). Keep both in sync. Add new pages to `site/sitemap.xml`.
- After changes, check there are no broken internal links and the page still works at phone width (390px).
