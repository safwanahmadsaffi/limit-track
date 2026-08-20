export async function syncToOdoo(amount, actionName) {
    const settings = await chrome.storage.local.get(['odooUrl', 'odooToken']);
    const baseUrl = settings.odooUrl || "https://limit-track.skysize.io";
    const apiToken = settings.odooToken;

    if (!apiToken) {
        console.warn("Odoo API Token not set. Skipping sync.");
        return null;
    }

    try {
        const response = await fetch(`${baseUrl}/api/skysize/tokens/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "call",
                params: {
                    api_token: apiToken,
                    amount: amount,
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
