// Unit tests for the pure helpers in site/assets/site.js (window.Dawnage).
// Run from the dawnage-website folder: node --test tests/site.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../site/assets/site.js", import.meta.url), "utf8");
const window = {
  matchMedia: () => ({ matches: false }),
  addEventListener() {},
  location: { search: "", href: "" },
};
const document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener() {},
  documentElement: { classList: { add() {} } },
};
const ctx = { window, document, URL, URLSearchParams, navigator: {} };
vm.runInNewContext(code, ctx);
const D = ctx.window.Dawnage;

const valid = { name: "Asha", whatsapp: "+91 98765 43210", goal: "Fat loss", obstacle: "Time", start: "Right away", website: "" };

test("valid application has no errors", () => {
  assert.deepEqual({ ...D.validateApplication({ name: "Asha", whatsapp: "+91 98765-43210", goal: "Fat loss" }) }, {});
});

test("missing fields give the three messages", () => {
  assert.deepEqual({ ...D.validateApplication({ name: " ", whatsapp: "12345", goal: "" }) }, {
    name: "Please enter your name.",
    whatsapp: "Please enter your WhatsApp number with country code, e.g. +91 98765 43210.",
    goal: "Please choose your main goal.",
  });
});

test("phone formats", () => {
  for (const ok of ["09876543210", "9876543210", "+91 98765 43210", "+919876543210"]) {
    assert.equal(D.validateApplication({ name: "A", whatsapp: ok, goal: "Fat loss" }).whatsapp, undefined, ok);
  }
  assert.ok(D.validateApplication({ name: "A", whatsapp: "1234567890123456", goal: "Fat loss" }).whatsapp);
});

test("whatsapp url round-trips tricky text", () => {
  const data = { name: "A & B #1?", whatsapp: "+91 98765 43210", goal: "HYROX prep", obstacle: "Line 1\nലൈൻ 2 💪", start: "" };
  const u = new URL(D.buildWhatsAppUrl("917907612261", data));
  assert.equal(u.origin + u.pathname, "https://wa.me/917907612261");
  assert.equal(
    u.searchParams.get("text"),
    "Hi Dawnage, I'd like to apply for coaching.\nName: A & B #1?\nWhatsApp: +91 98765 43210\n" +
      "Goal: HYROX prep\nBiggest obstacle: Line 1\nലൈൻ 2 💪\nStart: -"
  );
});

test("sheet body has every column", () => {
  const p = new URLSearchParams(
    D.buildSheetBody(
      { name: "A", whatsapp: "9876543210", goal: "Fat loss", obstacle: "x", start: "Right away" },
      "https://www.dawnage.com/coaching",
      "2026-11-21T10:00:00.000Z"
    )
  );
  assert.deepEqual([...p.keys()], ["timestamp", "name", "whatsapp", "goal", "obstacle", "start", "page"]);
  assert.equal(p.get("start"), "Right away");
  assert.equal(p.get("timestamp"), "2026-11-21T10:00:00.000Z");
  assert.equal(p.get("page"), "https://www.dawnage.com/coaching");
});

function harness(overrides = {}) {
  const calls = { fetch: [], navigate: [] };
  const deps = {
    waNumber: "917907612261",
    sheetUrl: "https://script.google.com/macros/s/abc/exec",
    pageUrl: "https://www.dawnage.com/coaching",
    now: () => "2026-11-21T10:00:00.000Z",
    fetch: (url, opts) => { calls.fetch.push([url, opts]); return Promise.resolve({}); },
    navigate: (url) => { calls.navigate.push(url); },
    ...overrides,
  };
  return { calls, deps };
}

test("saves then opens WhatsApp", () => {
  const { calls, deps } = harness();
  const errors = D.submitApplication(valid, deps);
  assert.deepEqual({ ...errors }, {});
  assert.equal(calls.fetch.length, 1);
  const [url, opts] = calls.fetch[0];
  assert.equal(url, deps.sheetUrl);
  assert.equal(opts.method, "POST");
  assert.equal(opts.mode, "no-cors");
  assert.equal(opts.keepalive, true);
  assert.equal(opts.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(opts.body, D.buildSheetBody(valid, deps.pageUrl, "2026-11-21T10:00:00.000Z"));
  assert.deepEqual(calls.navigate, [D.buildWhatsAppUrl("917907612261", valid)]);
});

test("blank sheetUrl still opens WhatsApp", () => {
  const { calls, deps } = harness({ sheetUrl: "" });
  D.submitApplication(valid, deps);
  assert.equal(calls.fetch.length, 0);
  assert.equal(calls.navigate.length, 1);
});

test("fetch throwing or rejecting still opens WhatsApp", async () => {
  let unhandled = 0;
  const onUnhandled = () => { unhandled++; };
  process.on("unhandledRejection", onUnhandled);
  try {
    const a = harness({ fetch: () => { throw new Error("offline"); } });
    D.submitApplication(valid, a.deps);
    assert.equal(a.calls.navigate.length, 1);
    const b = harness({ fetch: () => Promise.reject(new Error("blocked")) });
    D.submitApplication(valid, b.deps);
    assert.equal(b.calls.navigate.length, 1);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(unhandled, 0);
  } finally {
    process.off("unhandledRejection", onUnhandled);
  }
});

test("honeypot skips the save", () => {
  const { calls, deps } = harness();
  D.submitApplication({ ...valid, website: "spam.example" }, deps);
  assert.equal(calls.fetch.length, 0);
  assert.equal(calls.navigate.length, 1);
});

test("invalid data does nothing", () => {
  const { calls, deps } = harness();
  const errors = D.submitApplication({ ...valid, name: "" }, deps);
  assert.equal(errors.name, "Please enter your name.");
  assert.equal(calls.fetch.length, 0);
  assert.equal(calls.navigate.length, 0);
});

test("embedUrl formats", () => {
  const yt = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1";
  for (const s of [
    "https://youtu.be/dQw4w9WgXcQ?si=abc",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s",
    "https://youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  ]) {
    assert.equal(D.embedUrl(s), yt, s);
  }
  assert.equal(D.embedUrl("https://vimeo.com/123456789"), "https://player.vimeo.com/video/123456789?autoplay=1");
  assert.equal(D.embedUrl("https://vimeo.com/123456789/abcdef1234"), "https://player.vimeo.com/video/123456789?autoplay=1&h=abcdef1234");
  for (const bad of ["", "  ", "https://example.com/v.mp4", "not a url"]) assert.equal(D.embedUrl(bad), "", bad);
});

test("shouldPlayLoop", () => {
  assert.equal(D.shouldPlayLoop({ reducedMotion: false, saveData: false }), true);
  assert.equal(D.shouldPlayLoop({ reducedMotion: true, saveData: false }), false);
  assert.equal(D.shouldPlayLoop({ reducedMotion: false, saveData: true }), false);
});

test("storyIndex", () => {
  assert.equal(D.storyIndex(0, 300, 6), 1);
  assert.equal(D.storyIndex(290, 300, 6), 2);
  assert.equal(D.storyIndex(5000, 300, 6), 6);
  assert.equal(D.storyIndex(10, 0, 6), 1);
});
