const knownTrackers = ["trackerdomain.com", "anothertracker.com"];

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    switch (request.command) {
        case "checkCookies":
            classifyCookies().then(approvedCookies => {
                console.log("Approved cookies: ", approvedCookies);
                sendResponse({approvedCookies: approvedCookies});
            });
            return true;

        case "removeThirdPartyCookies":
            removeAllThirdPartyCookies().then(() => {
                sendResponse({done: true});
            });
            return true;

        case "removeCookies":
            const {host} = request;
            console.log(host)
            removeCookiesByHostname(host);
            break;

        case "setCookiePreference":
            const {url, allowCookies} = request;
            const hostname = new URL(url).hostname;

            console.log(hostname)
            if (!allowCookies) {

                chrome.cookies.getAll({domain: "." + hostname.split('.').slice(-2).join('.')}, (cookies) => {
                    cookies.forEach((cookie) => {
                        cookieDomain = cookie.domain.startsWith('.') ? "www." + cookie.domain.substring(1) : cookie.domain;
                        chrome.cookies.remove({
                            url: `http${cookie.secure ? "s" : ""}://${cookieDomain}${cookie.path}`, name: cookie.name
                        });
                    });
                });

                chrome.cookies.getAll({domain: hostname}, (cookies) => {
                    cookies.forEach((cookie) => {
                        cookieDomain = cookie.domain.startsWith('.') ? "www." + cookie.domain.substring(1) : cookie.domain;
                        chrome.cookies.remove({
                            url: `http${cookie.secure ? "s" : ""}://${cookieDomain}${cookie.path}`, name: cookie.name
                        });
                    });
                });
            }

            chrome.storage.local.set({
                [hostname]: allowCookies, ["." + hostname.split('.').slice(-2).join('.')]: allowCookies
            }, () => {
                if (chrome.runtime.lastError) {
                    sendResponse({success: false, error: chrome.runtime.lastError});
                } else {
                    sendResponse({success: true});
                }
            });
            return true;

        case "getCookiePreference":
            chrome.storage.local.get([request.hostname], (result) => {
                sendResponse({allowCookies: result[request.hostname]});
            });
            return true;
    }

});

function classifyCookies() {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({}, function (cookies) {

            let maliciousCookies = [];
            let userApprovedCookies = [];

            console.log(cookies)
            for (let cookie of cookies) {
                if (knownTrackers.includes(cookie.domain)) {
                    maliciousCookies.push(cookie);
                } else if (!cookie.secure || !cookie.httpOnly) {
                    maliciousCookies.push(cookie);
                } else if (new Date(cookie.expirationDate * 1000) > new Date(new Date().setFullYear(new Date().getFullYear() + 1))) {
                    maliciousCookies.push(cookie);
                } else {
                    userApprovedCookies.push(cookie);
                }
            }
            for (let cookie of maliciousCookies) {
                removeCookie(cookie);
            }

            resolve(cookies);
        });
    });
}

function removeCookie(cookie) {
    cookieDomain = cookie.domain.startsWith('.') ? "www." + cookie.domain.substring(1) : cookie.domain;
    chrome.cookies.remove({
        url: `http${cookie.secure ? "s" : ""}://${cookieDomain}${cookie.path}`, name: cookie.name
    }, function (details) {
        //console.log("Cookie removed: ", details);
    });
}

function removeCookiesByHostname(hostname) {
    chrome.cookies.getAll({domain: hostname}, (cookies) => {
        cookies.forEach((cookie) => {
            chrome.cookies.remove({
                url: `http${cookie.secure ? "s" : ""}://${cookie.domain}${cookie.path}`, name: cookie.name
            });
        });
    });
}


function removeAllThirdPartyCookies() {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({}, async function (cookies) {
            let promises = [];
            for (let cookie of cookies) {
                if (await isThirdPartyCookie(cookie)) {
                    promises.push(new Promise((resolve, reject) => {
                        chrome.cookies.remove({
                            url: (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path,
                            name: cookie.name
                        }, function (details) {
                            resolve();
                        });
                    }));
                }
            }
            await Promise.all(promises);
            resolve();
        });
    });
}

function isThirdPartyCookie(cookie) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
            if (!tabs[0]) {
                resolve(false);
                return;
            }
            let tabUrl = new URL(tabs[0].url);
            let tabDomain = tabUrl.hostname;
            let cookieDomain = cookie.domain.startsWith('.') ? "www." + cookie.domain.substring(1) : cookie.domain;


            resolve(cookieDomain !== tabDomain);
        });
    });
}


function checkAndDeleteCookiesForThirtySecond() {

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {

        if (tabs[0]) {
            let url = new URL(tabs[0].url);
            let hostname = url.hostname;

            console.log(hostname)
            areCookiesAllowedForSite(hostname, function (allowed) {
                if (!allowed) {
                    removeCookiesByHostname(hostname);
                }
            });
            console.log("." + hostname.split('.').slice(-2).join('.'))
            areCookiesAllowedForSite("." + hostname.split('.').slice(-2).join('.'), function (allowed) {
                if (!allowed) {
                    removeCookiesByHostname("." + hostname.split('.').slice(-2).join('.'));
                }
            });

        }
    });
}

function areCookiesAllowedForSite(hostname, callback) {

    chrome.storage.local.get([hostname], function (result) {
        let allowed = result[hostname];
        callback(allowed);
    });
}

setInterval(checkAndDeleteCookiesForThirtySecond, 5000);



// in this context, 30 seconds is equivalent to a week
function getCookies() {
    var allCookies = document.cookie.split(';');
    console.log(allCookies);
    for (var i = 0; i < allCookies.length; i++) {
        document.cookie = allCookies[i] + "=; expires="+ new Date(0).toUTCString(); // sets a new expiration date → deletes the cookie
        alert("Cookies deleted!")
    }
}
setInterval(getCookies, 30000);


