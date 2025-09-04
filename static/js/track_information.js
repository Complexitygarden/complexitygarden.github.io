function getSessionId() {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('sessionId', sid);
    }
    return sid;
}

function track_class_click(className) {

    const url = "https://e3yc4hoe81.execute-api.us-east-1.amazonaws.com/log";
    const now = new Date();
    console.log("Attempting to track information...");

    const body = {
        operation: "create",
        payload: {
            Item: {
                //pk: `class#${className}`,
                //sk: `ts#${now.toISOString()}`,
                className: className,
                timestamp: now.getTime(),
                isoTimestamp: now.toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || null,
                sessionId: getSessionId()
            }
        }
    }

    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),

        keepalive: true
    })
    .then(async (res) => {
        if (!res.ok) {
            const err = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} - ${err}`);
        }
        return res.json();
    })
    .then((data) => {
        console.debug("Tracked:", data);
    })
    .catch((err) => {
        console.error("Track failed:", err);
    })
}