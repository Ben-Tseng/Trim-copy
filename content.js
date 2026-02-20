(function () {
  "use strict";

  const COPY_EVENTS = ["mouseup", "keyup"];
  let lastCopiedText = "";
  let copyJobId = 0;

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

  async function copyToClipboard(text) {
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

  async function handleSelectionCopy() {
    const rawText = getSelectedText();
    if (!rawText) {
      return;
    }

    const trimmedText = rawText.trim();
    if (!trimmedText || trimmedText === lastCopiedText) {
      return;
    }

    const copied = await copyToClipboard(trimmedText);
    if (copied) {
      lastCopiedText = trimmedText;
    }
  }

  function scheduleSelectionCopy() {
    const currentJobId = ++copyJobId;
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        if (currentJobId !== copyJobId) {
          return;
        }
        void handleSelectionCopy();
      });
    }, 0);
  }

  COPY_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, scheduleSelectionCopy, false);
  });
})();
