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

//when the user types something, save their time
//if they keep typing then refresh the time, and set character to whatever they type
//if the tim

/**
 * Representation of an object that will track class information
 * 
 */
class SearchBurstTracker 
{
    /**
     * 
     * @param {int} initIdleTime Minimum time to register a search MILLISECONDS
     * @param {int} initMinChars Inclusive minimum character count to register a search
     * @param {(v: any, m: any) => {}} [logger=(v, m) => console.log("You typed: ", v, m) = {}] Logging function
     */
    constructor(initIdleTime = 0, initMinChars = 2, logger = (v, m) => console.log("You typed: ", v, m))
    {
        this.idleMS = initIdleTime;
        this.minChars = initMinChars;
        this.logger = logger;

        this.timer = null;
        this.typing = false;

        this.burstStart = 0;
        this.peakValue = "";
        this.peakLen = 0;
        this.lastValue = "";
        this.query = "";
    }

    /**
     * 
     * @param {String} val The value inside the search bar 
     */
    onFocus(val="")
    {
        this._beginBurst(val);
    }


    /**
     * This function starts or refreshes an idle timer to log, or if the input is a deletion input, logs the deleted value
     * 
     * @param {String} val The value inside the search bar
     * @param {Event} nativeEvent The event that caused the change in input
     * @returns {undefined} Nothing
     */
    onInput(val, nativeEvent = null)
    {
        const value = String(val ?? "");
        const inputType = nativeEvent?.inputType;
        const isDeletion = inputType ? inputType.startsWith("delete") : value.length < this.lastValue.length

        if (!this.burstStart)
        {
            this._beginBurst(value);
        }
        if (this.idleMS > 0)
        {
            this._armIdleTimer(value);
        }

        if (isDeletion)
        {
            this._finalize("delete", value);
            this._beginBurst(value);
            return;
        }

        if (value.length > this.peakLen)
        {
            this.peakLen = value.length;
            this.peakValue = value;
        }

        this.lastValue = value;
    }

    /**
     * This function logs the value inside the search bar when an Enter is clicked in the search bar
     * @param {String} val The value inside the search bar
     */
    onEnter(val)
    {
        this._finalize("enter", String(val ?? ""));
    }

    /**
     * This function logs the value inside the search bar when a the search bar is clicked away from
     * @param {String} val The value inside the search bar
     */
    onBlur(val)
    {
        this._finalize("blur", String(val ?? ""));
    }


    _cancelTimer()
    {
        if (this.timer)
            {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    _beginBurst(initalVal = "")
    {
        this._cancelTimer();
        this.burstStart = performance.now();
        this.lastValue = String(initalVal);
        this.peakValue = this.lastValue;
        this.peakLen = this.lastValue.length;
    }

    _armIdleTimer(currentVal)
    {
        this._cancelTimer();
        this.timer = setTimeout(() =>{
            this._finalize("idle", String(currentVal ?? ""));
        }, this.idleMS);
    }

    _finalize(reason, currentVal)
    {
        this._cancelTimer();

        //On deletion, log peak value
        //else log current value

        const valueToLog = reason === "delete" ? this.peakValue : currentVal;

        const trimmed = valueToLog.trim();

        if (trimmed.length >= this.minChars)
        {
            const durationMs = this.burstStart ? Math.round(performance.now() - this.burstStart) : null;
            this.logger(trimmed, {reason, durationMs, peakLen: this.peakLen, current: currentVal});
        }

        this.burstStart = 0;
        this.peakValue = "";
        this.peakLen = 0;
        this.lastValue = "";
    }
}