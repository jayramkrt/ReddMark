# ReddMark — Reddit Thread to Markdown

Download any Reddit post and its full comment tree as a clean `.md` file in one click.

## Features

- ✅ Works on **new Reddit** (`reddit.com`) and **old Reddit** (`old.reddit.com`)
- ✅ Correctly captures **all usernames** from `shreddit-comment` DOM attributes
- ✅ Captures post title, body, metadata (author, subreddit, score, date, URL)
- ✅ Captures all visible comments with depth-based indentation
- ✅ Toggle options: include/exclude body text and metadata
- ✅ Filename auto-generated from post title
- ✅ Runs entirely locally — no servers, no API keys

## Installation (Chrome / Edge / Brave)

1. Download and unzip `reddmark.zip`
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `reddit-md-extension` folder

## Usage

1. Navigate to any Reddit thread
2. Click the **Rm** icon in your toolbar
3. Preview shows title, subreddit, author, comment count, and score
4. Click **⬇ Download .md**

## Why usernames show correctly

New Reddit renders comments as `<shreddit-comment>` custom elements. The username, score, depth, and timestamp are stored as **HTML attributes** on this element (`author="username"`, `depth="0"`, `score="5"`, `created="..."`), which are directly accessible via `getAttribute()` — no Shadow DOM piercing needed.

The comment body is read from rendered `<p>` elements in the light DOM inside each comment.

## Output format

```markdown
# Post Title

**Subreddit:** r/example  
**Posted by:** u/username  
**Score:** 1234  

---

## Comments (42)

### u/top_commenter · 567 points
*Mon, 01 Jan 2024 12:00:00 GMT*

Top-level comment text.

---

  #### u/reply_user · 89 points
  *Mon, 01 Jan 2024 12:05:00 GMT*

  Reply text indented by depth level.
```
