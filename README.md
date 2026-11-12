# Dawnage website (Soft Strength)

The whole website is already built. It's plain HTML, so there's nothing to install and nothing to build.

```
dawnage-website/
├── README.md     ← you are here
├── CLAUDE.md     ← notes Claude Code reads automatically
└── site/         ← THE WEBSITE. This is the folder you upload.
    ├── index.html, coaching.html, apply.html … (20 pages)
    ├── assets/   ← styles, script, logo, icons
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
- "The client's prices are Basic ₹2,999, Growth ₹4,999 and Elite ₹7,999 a month. Update the plans."
- "Replace every [ANSWER] in the FAQ with these answers: …"
- "Make the orange slightly darker everywhere."

To check a change, refresh `index.html` in your browser.

**Small text fixes** you can also do yourself: open the page's `.html` file in VS Code, find the sentence with Ctrl/Cmd + F, edit it and save.

**Update the live site:** in Netlify, open your site, go to **Deploys** and drag the `site` folder onto the drop area there. The same link now shows the new version.

## 4. What's still placeholder

Anything the client still needs to supply is shown with a **dashed underline and [BRACKETS]**, and missing photos are grey boxes labelled "Photo · …". Collect these from the client:

| What | Where it appears |
|---|---|
| Plan prices and what each plan includes | Coaching (Plans), Ebooks |
| FAQ answers (marked [ANSWER]) | Most pages, FAQ |
| Testimonials, results and member names (with permission) | Coaching, goal pages |
| Founder story (two lines), coach names and specialities | Home, About |
| Run Club day, time, meeting point, pace groups, route, what to bring | Home, Community, Run Club |
| What The Census is, and the three steps to take part | Home, Community, The Census |
| Email, HQ address, Google Maps link, reply time | About, Contact |
| Client login link | Top menu ("Client login") |
| Ebook titles, descriptions and prices | Ebooks |
| Proof for the 85 / 93 / 72 / 89% stats | Home |
| A note on how WhatsApp data is stored | Dawnage AI |
| Real guides (the current one is a sample) | Resources, Guides |
| Coach portraits (3) | About |
| Run Club, Community and Census event photos | Community, Run Club, The Census |

Photo names to ask for, and which photos are already in place, are listed in `site/photos/README.txt`.

**Logo and photos already in place:** the real Dawnage logo (header, footer, browser icon, share image), the founder portrait (Home, About), the team photo (About), and black-and-white mood photos for the four goals, the sample guide and the two ebook covers. The mood photos came from the THEBETTERSELF and Northform project folders: **confirm they're licensed for commercial use (e.g. Unsplash) before launch**, or swap them for Dawnage's own shoots.

## 5. How the Apply form works

The form doesn't store anything. When someone presses **Send on WhatsApp**, it opens WhatsApp with their answers already typed out, addressed to +91 79076 12261. They press send and the conversation starts in the client's WhatsApp.

Links can pre-select a goal or plan: `apply.html?goal=fat-loss` or `apply.html?plan=Growth`.

## 6. Launch day (on dawnage.com)

1. No [BRACKETS] or grey photo boxes left. Ask Claude Code: "List every placeholder still on the site."
2. Ask Claude Code: **"Remove the noindex line from every page."** (Until you do, Google won't list the site.)
3. In Netlify: **Domain management → Add a domain** → `dawnage.com`, then change the DNS records at the client's domain registrar exactly as Netlify shows.
4. Old links like `/membership` and `/store` already redirect to the new pages (see `site/_redirects`).
5. Submit `https://www.dawnage.com/sitemap.xml` in Google Search Console.

Using Vercel instead? Drag the `site` folder onto vercel.com/drop (needs a free account). `vercel.json` already handles clean links and redirects. Vercel's free plan is for non-commercial use only, so the final client site needs the Pro plan.
