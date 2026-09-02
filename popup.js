// popup.js — ReddMark

const statusEl = document.getElementById("status");
const infoEl   = document.getElementById("info");
const btn      = document.getElementById("btn");
const optMeta  = document.getElementById("opt-meta");
const optBody  = document.getElementById("opt-body");

let cachedData = null;

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !isRedditThread(tab.url)) {
    setStatus("warning", "⚠ Open a Reddit post thread first, then click the extension.");
    return;
  }

  setStatus("default", `<span class="spinner"></span>Reading thread…`);
  btn.innerHTML = `<span class="spinner"></span>Loading…`;

  try {
    // Re-inject content script (safe to call even if already injected)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    }).catch(() => {});

    const response = await chrome.tabs.sendMessage(tab.id, { action: "scrapeThread" });

    if (!response || !response.success) {
      throw new Error(response?.error || "No response from page. Try refreshing.");
    }

    cachedData = response.data;
    showPreview(cachedData);
    btn.disabled = false;
    btn.textContent = "⬇  Download .md";

  } catch (err) {
    setStatus("error", `✖ ${err.message}`);
    btn.textContent = "Download .md";
  }
})();

btn.addEventListener("click", () => {
  if (!cachedData) return;
  const data = applyOptions(cachedData);
  const md   = threadToMarkdown(data);
  const name = safeFilename(data.title) + ".md";
  triggerDownload(md, name);
  btn.textContent = "✓ Downloaded!";
  setTimeout(() => { btn.textContent = "⬇  Download .md"; }, 2000);
});

function isRedditThread(url) {
  return url && /reddit\.com\/r\/[^/]+\/comments\//.test(url);
}

function setStatus(type, html) {
  statusEl.className = "card" + (type !== "default" ? ` ${type}` : "");
  statusEl.innerHTML = html;
}

function showPreview(data) {
  statusEl.style.display = "none";
  infoEl.style.display = "block";
  document.getElementById("info-title").textContent    = data.title;
  document.getElementById("info-sub").textContent      = data.subreddit;
  document.getElementById("info-author").textContent   = data.author;
  document.getElementById("info-comments").textContent = data.comments.length;
  document.getElementById("info-score").textContent    = data.score;
}

function applyOptions(data) {
  const d = { ...data, comments: [...data.comments] };
  if (!optBody.checked) d.body = "";
  if (!optMeta.checked) { d.score = ""; d.timestamp = ""; d.author = ""; }
  return d;
}

function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}
