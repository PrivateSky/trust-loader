function parseCookies(cookies) {
    const parsedCookies = {};
    if (!cookies) {
        return parsedCookies;
    }
    let splitCookies = cookies.split(";");
    splitCookies = splitCookies.map(splitCookie => splitCookie.trim());
    splitCookies.forEach(cookie => {
        const cookieComponents = cookie.split("=");
        const cookieName = cookieComponents[0].trim();
        let cookieValue = cookieComponents[1].trim();
        if (cookieValue === "null") {
            cookieValue = undefined;
        }
        parsedCookies[cookieName] = cookieValue;
    })

    return parsedCookies;
}

function removeTimezoneOffsetFromTimestamp(timestamp) {
    let currentDate = new Date(timestamp);
    return timestamp + currentDate.getTimezoneOffset() * 60 * 1000;
}

const handler = setInterval(() => {
    const {sessionExpiryTime} = parseCookies(document.cookie);
    if (sessionExpiryTime && parseInt(sessionExpiryTime) < removeTimezoneOffsetFromTimestamp(Date.now())) {
        clearInterval(handler);
        window.location = "/logout"
    }
}, 1000);
