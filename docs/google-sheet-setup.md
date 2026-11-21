# Saving coaching applications to a Google Sheet

When someone presses **Submit application** on the coaching page, two things happen:

1. Their answers are saved as a new row in a Google Sheet.
2. WhatsApp opens with their answers already typed, so they can press send.

Until you finish the setup below, only step 2 happens. The form still works.

This takes about 10 minutes and is done once, in the Dawnage Google account.

## 1. Create the Sheet

1. Go to **sheets.google.com** while signed in to the Dawnage Google account and create a blank spreadsheet.
2. Name it **Dawnage applications**.
3. Rename the tab at the bottom (it says "Sheet1") to **Applications**. Spelling matters.
4. In row 1 type these headings, one per column:
   `Time | Name | WhatsApp | Goal | Biggest obstacle | Start | Page`

## 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Delete everything in the editor and paste this:

```js
function doPost(e) {
  var p = e.parameter, text = function (v) { return "'" + String(v || ""); };
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Applications")
    .appendRow([new Date()].concat([p.name, p.whatsapp, p.goal, p.obstacle, p.start, p.page].map(text)));
  return ContentService.createTextOutput("ok");
}
```

3. Press the save icon.

The `text` part stores every answer exactly as typed, as plain text. That way phone numbers keep their leading 0, answers like 1/2 don't turn into dates, and nobody can slip a spreadsheet formula in through the form. The Time column uses the Sheet's own time zone (File → Settings → Time zone: India).

## 3. Publish it

1. Press **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set **Execute as: Me** and **Who has access: Anyone**.
4. Press **Deploy** and allow the permissions Google asks for. It may warn that the app isn't verified. Choose **Advanced → Go to … (unsafe)**; this is your own script.
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.

## 4. Connect it to the website

In Claude Code, say:

> Put this Sheet URL in the apply form: https://script.google.com/macros/s/…/exec

This fills the `data-sheet="…"` attribute on the form in `site/coaching.html`. Then upload the site again.

## 5. Test it

1. Open the coaching page on the live site and submit the form with the name **=1+1** and your own WhatsApp number.
2. WhatsApp should open with the message.
3. A new row should appear in the Sheet. The Name column must show **=1+1** as text, not **2**.

## If you change the script later

Use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL, so the website doesn't need updating.
