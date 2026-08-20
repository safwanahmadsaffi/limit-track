(() => {
  // src/content/index.js
  var PLATFORMS = {
    "chatgpt.com": "ChatGPT",
    "claude.ai": "Claude",
    "chat.deepseek.com": "DeepSeek",
    "gemini.google.com": "Gemini"
  };
  function detectPlatform() {
    const host = window.location.hostname;
    for (const [key, name] of Object.entries(PLATFORMS)) {
      if (host.includes(key)) return name;
    }
    return "Unknown";
  }
  var observer = new MutationObserver((mutations) => {
  });
  observer.observe(document.body, { childList: true, subtree: true });
  console.log(`Limit-Track Extension Active on ${detectPlatform()}`);
})();
