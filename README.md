# Dawnage website (Soft Strength)

The whole website is already built. It's plain HTML, so there's nothing to install and nothing to build.

```
dawnage-website/
├── README.md     ← you are here
├── CLAUDE.md     ← notes Claude Code reads automatically
├── docs/         ← design notes + Google Sheet setup for the apply form
├── tests/        ← automatic checks Claude Code runs after changes
└── site/         ← THE WEBSITE. This is the folder you upload.
    ├── index.html, coaching.html, community.html, hq.html … (8 pages)
    ├── assets/   ← styles, script, logo, icons
    ├── media/    ← homepage hero video loop goes here
    └── photos/   ← put the client's photos here
```

## 1. Look at it (1 minute)

Unzip, open the `site` folder and double-click `index.html`. It opens in your browser and every link works.

(Only the "page not found" page, `404.html`, looks unstyled when opened this way. It works once the site is online.)

## 2. Put it online and send the client a link (5 minutes, free)

1. Go to **app.netlify.com/drop**.
2. Drag the **`site`** folder onto the page. After a few seconds you get a link like `something-1234.netlify.app`.
3. **Sign up for a free account straight away** (the page offers it). A drop without an account is deleted after about an hour.
4. Optional: in the site's settings, rename it to something like `dawnage-preview.netlify.app`.
5. Send that link to the client.

Netlify's free plan allows commercial projects. The site tells Google not to index it during this preview stage (see "Launch day" below).

## 3. Make changes

**Easiest: ask Claude Code.** In VS Code, use **File → Open Folder** to open the `dawnage-website` folder, open Claude Code and say what you want in plain words. For example:

- "Change the hero headline to 'Your coach, in your pocket.'"
- "Put the photo `photos/founder.jpg` in the founder section on the home and about pages."
- "Here's the film link: https://youtu.be/… Put it on the homepage."
- "Put this Sheet URL in the apply form: …"
- "Make the orange slightly darker everywhere."

To check a change, refresh `index.html` in your browser.

**Small text fixes** you can also do yourself: open the page's `.html` file in VS Code, find the sentence with Ctrl/Cmd + F, edit it and save.

**Update the live site:** in Netlify, open your site, go to **Deploys** and drag the `site` folder onto the drop area there. The same link now shows the new version.

## 4. What's still placeholder

Anything the client still needs to supply is shown with a **dashed underline and [BRACKETS]**, and missing photos are grey boxes labelled "Photo · …". Collect these from the client:

| What | Where it appears |
|---|---|
| Hero video loop (landscape + vertical) and a large poster frame | Home |
| Full film link (YouTube/Vimeo) | Home ("Watch the film") |
| Coaching video link (Malayalam) | Coaching |
| Up to 6 client stories: before/after photos, result, starting point, coach's change (with consent) | Coaching |
| Number of clients coached + 3 client photos | Home |
| Founder story (two lines), coach names and specialities, coach portraits | About |
| Run Club: Instagram link, WhatsApp updates link (group/channel), a Saturday run photo | Community |
| Confirm 80+ Saturdays hosted and 150–200 weekly registrations | Community |
| Reebok and Fast&Up logos (white versions) and permission to show them | Community |
| Real photos to replace the 3 concept images (`photos/concept-*.webp`) | Community |
| The Senses: confirm name and wording, launch timing | Community |
| HQ address, hours, Google Maps link, studio photo | Dawnage HQ, About |
| Contact email | About |
| Ebook titles, one-liners and prices | Resources |
| Real guides (the current one is a sample) | Resources |
| Google Sheet for applications (see `docs/google-sheet-setup.md`) | Coaching (apply form) |

Photo names to ask for, and which photos are already in place, are listed in `site/photos/README.txt`.

**Logo and photos already in place:** the real Dawnage logo, the founder portrait (Home, About, Coaching video cover), the team photo (About, and the homepage hero until the video arrives), and black-and-white mood photos for the guide, ebooks and homepage tiles. The mood photos came from the THEBETTERSELF and Northform project folders: **confirm they're licensed for commercial use (e.g. Unsplash) before launch**, or swap them for Dawnage's own shoots.

## 5. How the apply form works

The apply form is at the bottom of the coaching page. When someone presses **Submit application**:

1. Their answers are saved as a new row in a Google Sheet (once it's set up; see `docs/google-sheet-setup.md`).
2. WhatsApp opens with their answers already typed out, addressed to +91 79076 12261. They press send and the conversation starts.

Until the Sheet is connected, only step 2 happens.

Links can pre-select a goal: `coaching.html?goal=fat-loss#apply`.

## 6. Launch day (on dawnage.com)

1. No [BRACKETS] or grey photo boxes left. Ask Claude Code: "List every placeholder still on the site."
2. Ask Claude Code: **"Remove the noindex line from every page."** (Until you do, Google won't list the site.)
3. In Netlify: **Domain management → Add a domain** → `dawnage.com`, then change the DNS records at the client's domain registrar exactly as Netlify shows.
4. Old links (`/apply`, `/fat-loss`, `/run-club`, `/membership`, `/store` …) already redirect to the right section of the new pages (see `site/_redirects`).
5. Submit `https://www.dawnage.com/sitemap.xml` in Google Search Console.

Using Vercel instead? Drag the `site` folder onto vercel.com/drop (needs a free account). `vercel.json` already handles clean links and redirects. Vercel's free plan is for non-commercial use only, so the final client site needs the Pro plan.
