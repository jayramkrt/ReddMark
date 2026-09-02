// content.js — ReddMark v1.2
// KEY FIX: shreddit-comment nesting means querySelector('p') on a parent
// also matches <p> tags inside child comments. We must scope body text
// to ONLY the div matching [id="${thingId}-post-rtjson-content"], which
// belongs exclusively to that comment. Children have their own such divs.

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "scrapeThread") {
    try {
      const data = scrapeThread();
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function txt(el) { return el ? el.innerText.trim() : ""; }
function atr(el, a) { return el ? (el.getAttribute(a) || "").trim() : ""; }

/* ─── New Reddit (shreddit) ──────────────────────────────────────────────── */
function scrapeNewReddit() {
  // ── Post metadata from shreddit-post element ────────────────────────────
  const postEl = document.querySelector("shreddit-post");

  const title =
    txt(document.querySelector('h1[slot="title"]')) ||
    txt(document.querySelector('[data-testid="post-title"]')) ||
    txt(document.querySelector("h1")) ||
    document.title;

  const subreddit =
    (postEl ? atr(postEl, "subreddit-prefixed-name").replace(/^r\//, "") : null) ||
    detectSubredditFromURL();

  const author =
    (postEl ? atr(postEl, "author") : "") ||
    txt(document.querySelector('[data-testid="post_author_link"]')) ||
    "unknown";

  const score =
    (postEl ? atr(postEl, "score") : "") || "?";

  const timestamp =
    (postEl ? atr(postEl, "created-timestamp") : "") ||
    new Date().toISOString();

  const postUrl = window.location.href.split("?")[0];

  // ── Post body ────────────────────────────────────────────────────────────
  // The post body div has id like "t3_XXXX-post-rtjson-content"
  const postId = postEl ? atr(postEl, "id") : "";
  const postBodyEl =
    (postId ? document.getElementById(`${postId}-post-rtjson-content`) : null) ||
    document.querySelector('[slot="text-body"]') ||
    document.querySelector('[data-testid="post-rtjson-content"]');
  const body = txt(postBodyEl);

  // ── Comments ─────────────────────────────────────────────────────────────
  // shreddit-comment elements are NESTED (children inside parents).
  // Each has: author, depth, score, created, thingId as attributes.
  // Body is in <div id="{thingId}-post-rtjson-content"> which is a DIRECT
  // child in the light DOM — not inside nested shreddit-comment children.
  const comments = [];

  document.querySelectorAll("shreddit-comment").forEach(el => {
    const depth   = parseInt(atr(el, "depth") || "0", 10);
    const cAuthor = atr(el, "author") || "[deleted]";
    const cScore  = atr(el, "score")  || "?";
    const cTime   = atr(el, "created") || "";
    const thingId = atr(el, "thingid") || atr(el, "thingId") || "";

    // Scope body to only THIS comment's rtjson div, not children's
    let cBody = "";
    if (thingId) {
      const bodyDiv = document.getElementById(`${thingId}-post-rtjson-content`);
      if (bodyDiv) {
        cBody = txt(bodyDiv);
      }
    }

    // Fallback: grab the first <p> that is a descendant of THIS comment
    // but NOT a descendant of any nested shreddit-comment child
    if (!cBody) {
      cBody = getDirectCommentText(el);
    }

    if (!cBody) cBody = "[removed]";

    comments.push({ depth, author: cAuthor, score: cScore, body: cBody, timestamp: cTime });
  });

  return { title, subreddit, author, body, postUrl, score, timestamp, comments };
}

/**
 * Gets text from paragraphs that belong DIRECTLY to this comment element,
 * excluding any text inside nested child shreddit-comment elements.
 */
function getDirectCommentText(commentEl) {
  const thingId = atr(commentEl, "thingid") || atr(commentEl, "thingId") || "";

  // Walk children to find text containers that are NOT inside a nested comment
  const walker = document.createTreeWalker(
    commentEl,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        // Skip entire subtrees of nested shreddit-comment children
        if (node !== commentEl && node.tagName && node.tagName.toLowerCase() === "shreddit-comment") {
          return NodeFilter.FILTER_REJECT;
        }
        // Accept <p> and <div> that look like body containers
        const tag = node.tagName ? node.tagName.toLowerCase() : "";
        if (tag === "p") return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  const paragraphs = [];
  let node;
  while ((node = walker.nextNode())) {
    const t = node.innerText ? node.innerText.trim() : "";
    if (t) paragraphs.push(t);
  }
  return paragraphs.join("\n");
}

/* ─── Old Reddit ─────────────────────────────────────────────────────────── */
function scrapeOldReddit() {
  const title     = txt(document.querySelector(".title.may-blank, a.title")) || document.title;
  const subreddit = detectSubredditFromURL();
  const author    = txt(document.querySelector(".top-matter .author")) || "unknown";
  const body      = txt(document.querySelector(".usertext-body .md"));
  const postUrl   = window.location.href.split("?")[0];
  const score     = txt(document.querySelector(".score.unvoted, .score.likes")) || "?";
  const timestamp = atr(document.querySelector("time.live-timestamp"), "datetime") || new Date().toISOString();

  const comments = [];
  document.querySelectorAll(".comment").forEach(el => {
    const depthM  = el.className.match(/depth-(\d+)/);
    const depth   = parseInt(depthM ? depthM[1] : "0", 10);
    const cAuthor = txt(el.querySelector(".author")) || "[deleted]";
    const cScore  = txt(el.querySelector(".score"))  || "?";
    const cBody   = txt(el.querySelector(".usertext-body .md")) || "[removed]";
    const cTime   = atr(el.querySelector("time"), "datetime") || "";
    comments.push({ depth, author: cAuthor, score: cScore, body: cBody, timestamp: cTime });
  });

  return { title, subreddit, author, body, postUrl, score, timestamp, comments };
}

/* ─── Router ─────────────────────────────────────────────────────────────── */
function detectSubredditFromURL() {
  const m = window.location.pathname.match(/\/r\/([^/]+)/);
  return m ? m[1] : "unknown";
}

function scrapeThread() {
  return window.location.hostname === "old.reddit.com"
    ? scrapeOldReddit()
    : scrapeNewReddit();
}
