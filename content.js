// content.js — injected into Reddit pages
// Listens for a message from the popup and responds with scraped thread data.

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "scrapeThread") {
    try {
      const data = scrapeThread();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // keep channel open for async response
});

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function text(el) {
  return el ? el.innerText.trim() : "";
}

function attr(el, a) {
  return el ? (el.getAttribute(a) || "").trim() : "";
}

/* ─── New Reddit (shreddit / reddit.redesign) ────────────────────────────── */

function scrapeNewReddit() {
  // Post title
  const titleEl =
    document.querySelector('h1[slot="title"]') ||
    document.querySelector('[data-testid="post-title"]') ||
    document.querySelector('div[data-test-id="post-content"] h1') ||
    document.querySelector('shreddit-post h1') ||
    document.querySelector('h1');

  const title = text(titleEl) || document.title;

  // Subreddit
  const subEl =
    document.querySelector('a[data-testid="subreddit-link"]') ||
    document.querySelector('shreddit-post [slot="subreddit-name"]') ||
    document.querySelector('a[href^="/r/"]');
  const subreddit = text(subEl).replace(/^r\//, "") || detectSubredditFromURL();

  // Author
  const authorEl =
    document.querySelector('shreddit-post [slot="authorName"]') ||
    document.querySelector('[data-testid="post_author_link"]') ||
    document.querySelector('a[data-testid="author-name"]');
  const author = text(authorEl).replace(/^u\//, "") || "unknown";

  // Post body
  const bodyEl =
    document.querySelector('[slot="text-body"]') ||
    document.querySelector('[data-testid="post-rtjson-content"]') ||
    document.querySelector('div.RichTextJSON-root') ||
    document.querySelector('[data-click-id="text"] div');
  const body = text(bodyEl);

  // Post URL
  const postUrl = window.location.href.split("?")[0];

  // Post metadata
  const scoreEl =
    document.querySelector('shreddit-post [slot="vote-count"]') ||
    document.querySelector('[data-testid="vote-count"]') ||
    document.querySelector('faceplate-number[pretty]');
  const score = text(scoreEl) || "?";

  // Timestamp
  const timeEl =
    document.querySelector('shreddit-post time') ||
    document.querySelector('time[datetime]');
  const timestamp = timeEl ? attr(timeEl, "datetime") : new Date().toISOString();

  // Comments — handle shreddit-comment tree
  const comments = [];
  scrapeCommentsNew(document, comments, 0);

  return { title, subreddit, author, body, postUrl, score, timestamp, comments };
}

function scrapeCommentsNew(root, acc, depth) {
  // shreddit-comment custom elements
  const commentEls = root.querySelectorAll("shreddit-comment");
  if (commentEls.length > 0) {
    commentEls.forEach(el => {
      // Depth is stored as attribute or via nesting
      const d = parseInt(el.getAttribute("depth") || depth, 10);
      const authorEl = el.querySelector('[slot="authorName"]') || el.querySelector('a[href^="/user/"]');
      const author = text(authorEl).replace(/^u\//, "") || "[deleted]";

      const scoreEl = el.querySelector('[slot="vote-count"]') || el.querySelector('faceplate-number');
      const score = text(scoreEl) || "?";

      const bodyEl = el.querySelector('[slot="comment"] div') || el.querySelector('.md') || el.querySelector('p');
      const body = text(bodyEl) || "[removed]";

      const timeEl = el.querySelector('time');
      const timestamp = timeEl ? attr(timeEl, "datetime") : "";

      acc.push({ depth: d, author, score, body, timestamp });
    });
    return;
  }

  // Fallback: redesign comment threads
  const threads = root.querySelectorAll('[data-testid="comment"]');
  threads.forEach(el => {
    const depth = computeDepthFromIndent(el);
    const authorEl = el.querySelector('[data-testid="comment_author_link"]') || el.querySelector('a[href^="/user/"]');
    const author = text(authorEl).replace(/^u\//, "") || "[deleted]";
    const scoreEl = el.querySelector('[data-testid="vote-count"]') || el.querySelector('[id^="vote-arrows"]');
    const score = text(scoreEl) || "?";
    const bodyEl = el.querySelector('[data-testid="comment"] .RichTextJSON-root') || el.querySelector('p');
    const body = text(bodyEl) || "[removed]";
    const timeEl = el.querySelector('time');
    const timestamp = timeEl ? attr(timeEl, "datetime") : "";
    acc.push({ depth, author, score, body, timestamp });
  });
}

function computeDepthFromIndent(el) {
  // Reddit redesign uses padding-left on a wrapper to indicate depth
  const wrapper = el.closest('[style*="padding-left"]') || el.parentElement;
  if (!wrapper) return 0;
  const pl = parseInt(getComputedStyle(wrapper).paddingLeft || "0", 10);
  return Math.round(pl / 16);
}

/* ─── Old Reddit ─────────────────────────────────────────────────────────── */

function scrapeOldReddit() {
  const titleEl = document.querySelector(".title.may-blank") || document.querySelector('a.title');
  const title = text(titleEl) || document.title;

  const subreddit = detectSubredditFromURL();
  const authorEl = document.querySelector('.top-matter .author');
  const author = text(authorEl) || "unknown";

  const bodyEl = document.querySelector('.usertext-body .md');
  const body = text(bodyEl);

  const postUrl = window.location.href.split("?")[0];
  const scoreEl = document.querySelector('.score.unvoted') || document.querySelector('.score.likes');
  const score = text(scoreEl) || "?";
  const timeEl = document.querySelector('time.live-timestamp');
  const timestamp = attr(timeEl, "datetime") || new Date().toISOString();

  const comments = [];
  const commentEls = document.querySelectorAll('.comment');
  commentEls.forEach(el => {
    const depth = (el.className.match(/depth-(\d+)/) || [])[1];
    const authorEl = el.querySelector('.author');
    const author = text(authorEl) || "[deleted]";
    const scoreEl = el.querySelector('.score');
    const score = text(scoreEl) || "?";
    const bodyEl = el.querySelector('.usertext-body .md');
    const body = text(bodyEl) || "[removed]";
    const timeEl = el.querySelector('time');
    const timestamp = timeEl ? attr(timeEl, "datetime") : "";
    comments.push({ depth: parseInt(depth || "0", 10), author, score, body, timestamp });
  });

  return { title, subreddit, author, body, postUrl, score, timestamp, comments };
}

/* ─── Router ──────────────────────────────────────────────────────────────── */

function detectSubredditFromURL() {
  const m = window.location.pathname.match(/\/r\/([^/]+)/);
  return m ? m[1] : "unknown";
}

function scrapeThread() {
  const isOld = window.location.hostname === "old.reddit.com";
  return isOld ? scrapeOldReddit() : scrapeNewReddit();
}
