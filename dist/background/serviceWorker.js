(() => {
  // src/utils/odooSync.js
  async function syncToOdoo(amount, actionName) {
    const settings = await chrome.storage.local.get(["odooUrl", "odooToken"]);
    const baseUrl = settings.odooUrl || "https://limit-track.skysize.io";
    const apiToken = settings.odooToken;
    if (!apiToken) {
      console.warn("Odoo API Token not set. Skipping sync.");
      return null;
    }
    try {
      const response = await fetch(`${baseUrl}/api/skysize/tokens/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            api_token: apiToken,
            amount,
            reference: actionName
          }
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      return result.result;
    } catch (error) {
      console.error("Odoo Sync Failed:", error);
      return null;
    }
  }

  // src/background/serviceWorker.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TRACK_TOKENS") {
      handleTokenTracking(request.payload);
    }
    return true;
  });
  async function handleTokenTracking(data) {
    const { platform, inputTokens, outputTokens } = data;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const storageKey = `tokens_${today}`;
    const currentData = await chrome.storage.local.get(storageKey);
    const dayStats = currentData[storageKey] || {};
    if (!dayStats[platform]) {
      dayStats[platform] = { input: 0, output: 0, total: 0 };
    }
    dayStats[platform].input += inputTokens;
    dayStats[platform].output += outputTokens;
    dayStats[platform].total += inputTokens + outputTokens;
    await chrome.storage.local.set({ [storageKey]: dayStats });
    const totalNewTokens = inputTokens + outputTokens;
    await syncToOdoo(totalNewTokens, `LLM Usage: ${platform} (${inputTokens} in, ${outputTokens} out)`);
  }
})();
