
const hostname = window.location.hostname;

function showCookieConsentDialog() {


    if (confirm("Do you accept cookies from this site?")) {

        chrome.runtime.sendMessage({
            command: "setCookiePreference",
            url: window.location.href,
            allowCookies: true
        });
    } else {
        chrome.runtime.sendMessage({
            command: "setCookiePreference",
            url: window.location.href,
            allowCookies: false
        });
    }
}


function deleteAllCookies(hostname) {
    chrome.runtime.sendMessage({
        command: "removeCookies",
        host: hostname,
    });
}

chrome.runtime.sendMessage({command: "getCookiePreference", hostname: hostname}, (response) => {

    if (response.allowCookies === undefined) {
        showCookieConsentDialog();
    }
    if (response.allowCookies === true) {
        console.log("Cookies allowed");
    } else {
        console.log("Cookies denied");
        deleteAllCookies(hostname);
    }
});

chrome.runtime.sendMessage({command: "getCookiePreference", hostname: "." + hostname.split('.').slice(-2).join('.')}, (response) => {

    if (response.allowCookies === undefined) {
        showCookieConsentDialog();
    }
    if (response.allowCookies === true) {
        console.log("Cookies allowed");
    } else {
        console.log("Cookies denied");
        deleteAllCookies("." + hostname.split('.').slice(-2).join('.'));
    }
});







