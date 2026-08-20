import { syncToOdoo } from '../utils/odooSync.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRACK_TOKENS') {
        handleTokenTracking(request.payload);
    }
    return true;
});

async function handleTokenTracking(data) {
    const { platform, inputTokens, outputTokens } = data;
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Local Storage Update
    const storageKey = `tokens_${today}`;
    const currentData = await chrome.storage.local.get(storageKey);
    const dayStats = currentData[storageKey] || {};
    
    if (!dayStats[platform]) {
        dayStats[platform] = { input: 0, output: 0, total: 0 };
    }
    
    dayStats[platform].input += inputTokens;
    dayStats[platform].output += outputTokens;
    dayStats[platform].total += (inputTokens + outputTokens);
    
    await chrome.storage.local.set({ [storageKey]: dayStats });

    // 2. Odoo Sync (Automatic)
    const totalNewTokens = inputTokens + outputTokens;
    await syncToOdoo(totalNewTokens, `LLM Usage: ${platform} (${inputTokens} in, ${outputTokens} out)`);
}
