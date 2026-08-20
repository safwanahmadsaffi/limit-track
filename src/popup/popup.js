document.addEventListener('DOMContentLoaded', async () => {
    const odooUrlInput = document.getElementById('odooUrl');
    const odooTokenInput = document.getElementById('odooToken');
    const saveBtn = document.getElementById('saveBtn');
    const statsDiv = document.getElementById('stats');

    // Load saved settings
    const settings = await chrome.storage.local.get(['odooUrl', 'odooToken']);
    if (settings.odooUrl) odooUrlInput.value = settings.odooUrl;
    if (settings.odooToken) odooTokenInput.value = settings.odooToken;

    // Load today's stats
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `tokens_${today}`;
    const data = await chrome.storage.local.get(storageKey);
    const dayStats = data[storageKey] || {};

    if (Object.keys(dayStats).length === 0) {
        statsDiv.innerText = "No tokens tracked today.";
    } else {
        let html = '<table style="width:100%">';
        for (const [platform, stats] of Object.entries(dayStats)) {
            html += `<tr><td><strong>${platform}</strong></td><td align="right">${stats.total} tokens</td></tr>`;
        }
        html += '</table>';
        statsDiv.innerHTML = html;
    }

    // Save settings
    saveBtn.addEventListener('click', async () => {
        await chrome.storage.local.set({
            odooUrl: odooUrlInput.value,
            odooToken: odooTokenInput.value
        });
        alert('Settings saved!');
    });
});
