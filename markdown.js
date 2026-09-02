// markdown.js — ReddMark

function threadToMarkdown(data) {
  const { title, subreddit, author, body, postUrl, score, timestamp, comments } = data;
  const lines = [];

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push(`# ${title}`);
  lines.push("");

  if (subreddit) lines.push(`**Subreddit:** r/${subreddit}  `);
  if (author)    lines.push(`**Posted by:** u/${author}  `);
  if (score)     lines.push(`**Score:** ${score}  `);
  if (postUrl)   lines.push(`**URL:** ${postUrl}  `);
  if (timestamp) {
    const d = new Date(timestamp);
    lines.push(`**Posted:** ${isNaN(d) ? timestamp : d.toUTCString()}  `);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Post body ───────────────────────────────────────────────────────────────
  if (body) {
    lines.push("## Post");
    lines.push("");
    lines.push(body);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Comments ────────────────────────────────────────────────────────────────
  if (comments.length > 0) {
    lines.push(`## Comments (${comments.length})`);
    lines.push("");

    comments.forEach((c, i) => {
      const indent = "  ".repeat(c.depth);
      const hdr    = c.depth === 0 ? "###" : "####";

      lines.push(`${indent}${hdr} u/${c.author} · ${c.score} points`);

      if (c.timestamp) {
        const d = new Date(c.timestamp);
        lines.push(`${indent}*${isNaN(d) ? c.timestamp : d.toUTCString()}*`);
      }

      lines.push("");
      c.body.split("\n").forEach(bl => lines.push(`${indent}${bl}`));
      lines.push("");

      // Separator between top-level comments
      if (c.depth === 0 && i < comments.length - 1) {
        lines.push(`${indent}---`);
        lines.push("");
      }
    });
  } else {
    lines.push("*No comments found.*");
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Downloaded with ReddMark — ${new Date().toUTCString()}*`);

  return lines.join("\n");
}

function safeFilename(title) {
  return (title || "reddit-thread")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "reddit-thread";
}
