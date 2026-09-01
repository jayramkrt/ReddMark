// markdown.js — converts scraped Reddit thread data → Markdown string

function threadToMarkdown(data) {
  const { title, subreddit, author, body, postUrl, score, timestamp, comments } = data;

  const lines = [];

  // ── Front matter ────────────────────────────────────────────────────────
  lines.push(`# ${title}`);
  lines.push("");
  lines.push(`**Subreddit:** r/${subreddit}  `);
  lines.push(`**Posted by:** u/${author}  `);
  lines.push(`**Score:** ${score}  `);
  lines.push(`**URL:** ${postUrl}  `);
  if (timestamp) {
    const date = new Date(timestamp);
    lines.push(`**Posted:** ${isNaN(date) ? timestamp : date.toUTCString()}  `);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── Post body ────────────────────────────────────────────────────────────
  if (body) {
    lines.push("## Post");
    lines.push("");
    lines.push(body);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // ── Comments ─────────────────────────────────────────────────────────────
  if (comments.length > 0) {
    lines.push(`## Comments (${comments.length})`);
    lines.push("");

    comments.forEach(c => {
      const indent = "  ".repeat(c.depth); // 2 spaces per depth level
      const prefix = c.depth === 0 ? "###" : "####";

      // Header line — author + score
      lines.push(`${indent}${prefix} u/${c.author} · ${c.score} points`);
      if (c.timestamp) {
        const d = new Date(c.timestamp);
        lines.push(`${indent}*${isNaN(d) ? c.timestamp : d.toUTCString()}*`);
      }
      lines.push("");

      // Comment body — indent each line
      const bodyLines = c.body.split("\n");
      bodyLines.forEach(bl => {
        lines.push(`${indent}${bl}`);
      });
      lines.push("");
    });
  } else {
    lines.push("*No comments found.*");
    lines.push("");
  }

  lines.push("---");
  lines.push(`*Downloaded with Reddit Thread to Markdown — ${new Date().toUTCString()}*`);

  return lines.join("\n");
}

function safeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "reddit-thread";
}
