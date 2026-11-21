"""Structural checks for the Dawnage site (stdlib only).

Run from the dawnage-website folder:  python3 -m unittest tests/check_site.py -v
"""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"

EXPECTED = {"index.html", "coaching.html", "community.html", "hq.html", "resources.html",
            "guide-sample-guide.html", "about.html", "404.html"}
DELETED = ["dawnage-ai", "fat-loss", "muscle-gain", "body-recomposition", "calisthenics", "apply", "faq",
           "contact", "run-club", "the-census", "guides", "ebooks", "calculators"]
REDIRECTS = {"/dawnage-ai": "/coaching", "/fat-loss": "/coaching#goals", "/muscle-gain": "/coaching#goals",
             "/body-recomposition": "/coaching#goals", "/calisthenics": "/coaching#goals", "/apply": "/coaching#apply",
             "/faq": "/coaching#faq", "/contact": "/about#contact", "/run-club": "/community#run-club",
             "/the-census": "/community#sencs", "/guides": "/resources#guides", "/ebooks": "/resources#ebooks",
             "/calculators": "/resources#calculators", "/membership": "/coaching", "/store": "/resources#ebooks",
             "/index": "/"}
NAV = ["coaching.html", "community.html", "hq.html", "resources.html", "about.html"]
LINK_ATTRS = {"a": ["href"], "link": ["href"], "img": ["src"], "script": ["src"], "source": ["src"],
              "video": ["src", "poster"]}


class _Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.add(a["id"])
        for name in LINK_ATTRS.get(tag, []):
            if a.get(name):
                self.links.append(a[name])


def pages():
    return sorted(p.name for p in SITE.glob("*.html"))


def read(page):
    return (SITE / page).read_text(encoding="utf-8")


def _collect(page):
    c = _Collector()
    c.feed(read(page))
    return c


def links(page):
    return _collect(page).links


def ids(page):
    return _collect(page).ids


def chrome(page, tag):
    pattern = r'<header class="site-header.*?</header>' if tag == "header" else r"<footer.*?</footer>"
    m = re.search(pattern, read(page), re.S)
    return re.sub(r'\s*aria-current="page"', "", m.group(0)) if m else ""


def is_internal(url):
    return not re.match(r"^(https?:|mailto:|tel:|#|data:)", url)


def resolve(page, url):
    """File path an internal link points at (fragment and query removed)."""
    path = url.split("#")[0].split("?")[0]
    if path.startswith("/"):
        path = path.lstrip("/") or "index.html"
    return SITE / path


def text(page):
    s = re.sub(r"<script.*?</script>|<style.*?</style>", " ", read(page), flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))


def main_html(page):
    m = re.search(r"<main.*?</main>", read(page), re.S)
    return m.group(0) if m else ""


def parse_redirects():
    out = {}
    for line in (SITE / "_redirects").read_text().splitlines():
        parts = line.split()
        if len(parts) == 3:
            out[parts[0]] = (parts[1], parts[2])
    return out


class Structure(unittest.TestCase):
    def test_page_set(self):
        self.assertEqual(set(pages()), EXPECTED)

    def test_internal_links_resolve(self):
        broken = [(p, u) for p in pages() for u in links(p) if is_internal(u) and not resolve(p, u).exists()]
        self.assertEqual(broken, [])

    def test_noindex_everywhere(self):
        missing = [p for p in pages() if '<meta name="robots" content="noindex">' not in read(p)]
        self.assertEqual(missing, [])

    def test_shared_header_footer(self):
        shared = sorted(EXPECTED - {"coaching.html", "404.html"})
        for tag in ("header", "footer"):
            ref = chrome("index.html", tag)
            self.assertTrue(ref, tag)
            for p in shared:
                self.assertEqual(chrome(p, tag), ref, f"{tag} differs in {p}")
            rooted = re.sub(r'(href|src)="/', r'\1="', chrome("404.html", tag))
            self.assertEqual(rooted, ref, f"{tag} differs in 404.html")

    def test_nav_targets(self):
        m = re.search(r'<div class="nav-links">(.*?)</div>', read("index.html"), re.S)
        self.assertEqual(re.findall(r'href="([^"]+)"', m.group(1)), NAV)

    def test_redirects(self):
        self.assertEqual(parse_redirects(), {k: (v, "301") for k, v in REDIRECTS.items()})
        cfg = json.loads((SITE / "vercel.json").read_text())
        self.assertTrue(cfg.get("cleanUrls"))
        self.assertTrue(all(r["permanent"] is True for r in cfg["redirects"]))
        got = {r["source"]: r["destination"] for r in cfg["redirects"]}
        self.assertEqual(got, {k: v for k, v in REDIRECTS.items() if k != "/index"})

    def test_sitemap(self):
        locs = set(re.findall(r"<loc>(.*?)</loc>", (SITE / "sitemap.xml").read_text()))
        want = {"https://www.dawnage.com/" + ("" if p == "index.html" else p[:-5]) for p in EXPECTED - {"404.html"}}
        self.assertEqual(locs, want)

    def test_no_removed_things(self):
        banned = ["Dawnage AI", "dawnage-ai", "AI assistant", "client-login", "Client login"] + [d + ".html" for d in DELETED]
        files = [SITE / p for p in pages()] + [SITE / "assets" / "site.js", SITE / "sitemap.xml"]
        hits = [(f.name, b) for f in files for b in banned if b in f.read_text(encoding="utf-8")]
        self.assertEqual(hits, [])


class Home(unittest.TestCase):
    def test_home_hero_video(self):
        html = read("index.html")
        m = re.search(r"<video\b[^>]*>", html)
        self.assertTrue(m, "no <video>")
        tag = m.group(0)
        self.assertIn('class="hero-loop"', tag)
        for attr in (" muted", " loop", " playsinline", 'poster="photos/team.webp"',
                     'data-src-wide="media/hero-loop.mp4"', 'data-src-tall="media/hero-loop-vertical.mp4"'):
            self.assertIn(attr, tag)
        self.assertNotIn(" src=", tag)
        self.assertNotIn("<source", html)
        self.assertRegex(html, r'<button[^>]*class="loop-toggle"')
        self.assertRegex(html, r"<h1[^>]*>\s*Do it anyway\.\s*</h1>")

    def test_home_film(self):
        html = read("index.html")
        self.assertRegex(html, r'<button[^>]*data-film="[^"]*"[^>]*data-film-mode="dialog"')
        self.assertRegex(html, r'<dialog[^>]*id="film-dialog"')

    def test_home_screens(self):
        main = main_html("index.html")
        self.assertEqual(len(re.findall(r"<section\b", main)), 5)
        t = text("index.html")
        self.assertIn("The Dawnage app.", t)
        self.assertIn("clients coached", t)
        for href in ("coaching.html", "community.html", "hq.html", "resources.html", "coaching.html#results", "about.html"):
            self.assertIn(f'href="{href}"', main, href)
        self.assertNotRegex(re.sub(r"<[^>]+>", " ", main), r"\d+\s*%")
        self.assertNotIn("<details", main)


class Coaching(unittest.TestCase):
    def test_coaching_funnel(self):
        html = read("coaching.html")
        header = re.search(r"<header.*?</header>", html, re.S).group(0)
        self.assertNotIn("nav-links", html)
        self.assertNotIn("menu-btn", html)
        self.assertIn('href="index.html"', header)
        self.assertIn('href="#apply"', header)
        self.assertTrue({"results", "goals", "faq", "apply", "apply-form", "apply-status"} <= ids("coaching.html"))
        other = {"community.html", "hq.html", "resources.html", "about.html"}
        self.assertEqual([u for u in links("coaching.html") if u.split("#")[0] in other], [])

    def test_coaching_form(self):
        html = read("coaching.html")
        form = re.search(r'<form[^>]*id="apply-form".*?</form>', html, re.S).group(0)
        names = re.findall(r'<(?:input|select|textarea)[^>]*name="([^"]+)"', form)
        self.assertEqual(names, ["name", "whatsapp", "goal", "obstacle", "start", "website"])
        def options(name):
            sel = re.search(r'<select[^>]*name="%s".*?</select>' % name, form, re.S).group(0)
            return re.findall(r'<option[^>]*value="([^"]*)"', sel)
        self.assertEqual(options("goal"), ["", "Fat loss", "Muscle building", "HYROX prep", "Calisthenics", "Something else"])
        self.assertEqual(options("start"), ["", "Right away", "In the next 2 weeks", "Within a month", "Just exploring"])
        tag = re.search(r'<form[^>]*>', form).group(0)
        self.assertIn('data-wa="917907612261"', tag)
        self.assertIn("data-sheet=", tag)
        for m in re.finditer(r'<(input|select|textarea)([^>]*)>', form):
            attrs = m.group(2)
            if 'name="website"' in attrs or 'type="hidden"' in attrs:
                continue
            fid = re.search(r'id="([^"]+)"', attrs).group(1)
            self.assertIn(f'<label for="{fid}"', form, fid)

    def test_coaching_sections(self):
        main = main_html("coaching.html")
        self.assertEqual(len(re.findall(r"<section\b", main)), 7)
        self.assertEqual(len(re.findall(r'<article class="story', main)), 6)
        t = text("coaching.html")
        for gone in ("What happens after you apply", "Plans", "\u20b9"):
            self.assertNotIn(gone, t)

    def test_faq_jsonld(self):
        html = read("coaching.html")
        data = None
        for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
            d = json.loads(block)
            if d.get("@type") == "FAQPage":
                data = d
        self.assertIsNotNone(data)
        summaries = [re.sub(r"<[^>]+>", "", s).strip() for s in re.findall(r"<summary>(.*?)<span", html, re.S)]
        self.assertEqual([q["name"] for q in data["mainEntity"]], summaries)
        self.assertEqual(len(summaries), 5)


if __name__ == "__main__":
    unittest.main()
