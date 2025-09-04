//Function which tracks information of the user when something is clicked
//Attach track_class_click() to wherever you want to track class information (for example when opening description)



function getSessionId() {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem('sessionId', sid);
    }
    return sid;
}

function track_class_click(className, extra = {}) {

    const url = "https://e3yc4hoe81.execute-api.us-east-1.amazonaws.com/log";
    const now = new Date();
    console.log("Attempting to track information...");
    console.log(navigator.language);
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const body = {
        operation: "create",
        payload: {
            Item: {
                className: className,
                actionSource: extra.action || null,
                timestamp: now.getTime(),
                isoTimestamp: now.toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer || null,
                sessionId: getSessionId(),
                language : navigator.language, //"en-US"
                timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone // "America/New_York.. "
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