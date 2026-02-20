"use strict";

async function runTrimCopyOnTab(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      function getSelectedText() {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === "TEXTAREA" ||
            (activeEl.tagName === "INPUT" &&
              /^(text|search|url|tel|password|email)$/i.test(activeEl.type)))
        ) {
          const start = activeEl.selectionStart;
          const end = activeEl.selectionEnd;
          if (typeof start === "number" && typeof end === "number" && end > start) {
            return activeEl.value.slice(start, end);
          }
        }

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          return "";
        }
        return selection.toString();
      }

      async function copyText(text) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (error) {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.top = "-9999px";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          let copied = false;
          try {
            copied = document.execCommand("copy");
          } finally {
            document.body.removeChild(textarea);
          }
          return copied;
        }
      }

      const selected = getSelectedText();
      const trimmed = selected.trim();
      if (!trimmed) {
        return { ok: false, reason: "empty_selection" };
      }

      const copied = await copyText(trimmed);
      return copied ? { ok: true } : { ok: false, reason: "copy_failed" };
    }
  });

  return results?.[0]?.result ?? { ok: false, reason: "unknown" };
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  try {
    await runTrimCopyOnTab(tab.id);
  } catch (error) {
    // Keep silent to avoid noisy UX in production pages.
    console.error("Trim Copy failed:", error);
  }
});
