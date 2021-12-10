setInterval(() => {
    console.log(document.cookie);
    if (!document.cookie.includes("accessTokenCookie") && document.cookie.includes("isActiveSession")) {
        clearInterval();
        window.location = "/logout"
    }
}, 1000);
