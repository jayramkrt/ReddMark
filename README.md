# Reddit Thread to Markdown — Browser Extension

Download any Reddit post and its full comment tree as a clean `.md` file in one click.

## Features

- ✅ Works on **new Reddit** (`reddit.com`) and **old Reddit** (`old.reddit.com`)
- ✅ Captures **post title, body, metadata** (author, subreddit, score, date, URL)
- ✅ Captures **all visible comments** with depth-based indentation
- ✅ Toggle options: skip body text, skip metadata, include collapsed comments
- ✅ Filename auto-generated from post title
- ✅ No external servers — everything runs locally in your browser

## Installation (Chrome / Edge / Brave)

1. Download or clone this folder.
2. Open your browser and go to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `reddit-md-extension` folder.
5. The extension icon will appear in your toolbar.

## Usage

1. Navigate to any Reddit post (e.g. `reddit.com/r/programming/comments/…`).
2. Click the **Md** extension icon in your toolbar.
3. A preview shows the thread title, subreddit, comment count, and score.
4. Adjust options if needed, then click **⬇ Download .md**.

## Output Format

```markdown
# Post Title Here

**Subreddit:** r/example  
**Posted by:** u/username  
**Score:** 1234  
**URL:** https://reddit.com/r/...  
**Posted:** Mon, 01 Jan 2024 12:00:00 GMT  

---

## Post

Post body text goes here…

---

## Comments (42)

### u/top_commenter · 567 points
*Mon, 01 Jan 2024 12:05:00 GMT*

Top-level comment text.

  #### u/reply_user · 89 points
  *Mon, 01 Jan 2024 12:10:00 GMT*

  Reply text, indented by depth.
```

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `content.js` | Injected into Reddit pages; scrapes the DOM |
| `markdown.js` | Converts scraped data → Markdown string |
| `popup.html` | Extension popup UI |
| `popup.js` | Popup logic: messaging, options, download trigger |
| `icons/` | Extension icons (16 / 48 / 128 px) |

## Notes

- Reddit's DOM structure changes occasionally. If scraping produces empty results, try refreshing the Reddit page and clicking the extension again.
- The extension only reads the currently **visible** comments. Scroll down or expand "load more comments" before downloading to capture more.
- Works with Manifest V3 (Chrome 88+).
