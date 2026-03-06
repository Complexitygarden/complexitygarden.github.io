// Stats for the About modal: complexity classes, theorems, and visitor counts from AWS

const STATS_AWS_URL = "https://e3yc4hoe81.execute-api.us-east-1.amazonaws.com/log";

async function fetchVisitorCounts() {
    // The Lambda scans the entire DynamoDB table, counts distinct sessionIds
    // for all time and for the last 30 days, returning { visitorsAllTime, visitorsMonth }.
    const body = {
        operation: "visitorStats",
        payload: {}
    };

    const response = await fetch(STATS_AWS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`AWS stats fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
        month:   data.visitorsMonth,
        allTime: data.visitorsAllTime
    };
}

function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

async function loadAboutStats() {
    // Classes and theorems come from the already-fetched networkProcessor data
    if (window.networkProcessor) {
        setStatValue('stat-classes',  window.networkProcessor.classes.size);
        setStatValue('stat-theorems', window.networkProcessor.theorems.length);
    }

    // Visitor counts from AWS (unique session IDs)
    try {
        const { month, allTime } = await fetchVisitorCounts();
        setStatValue('stat-visitors-month',   month   != null ? month.toLocaleString()   : 'N/A');
        setStatValue('stat-visitors-alltime', allTime != null ? allTime.toLocaleString() : 'N/A');
    } catch (err) {
        console.error("Could not load visitor stats:", err);
        setStatValue('stat-visitors-month',   'N/A');
        setStatValue('stat-visitors-alltime', 'N/A');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const aboutLink = document.getElementById('about-link');
    if (aboutLink) {
        aboutLink.addEventListener('click', function () {
            loadAboutStats();
        });
    }
});
