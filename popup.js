

document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('checkCookies').addEventListener('click', function() {
        chrome.runtime.sendMessage({command: "checkCookies"}, function(response) {
            let cookieList = document.getElementById('cookieList');
            cookieList.innerHTML = '';

            response.approvedCookies.forEach(function(cookie) {
                let cookieDiv = document.createElement('div');
                cookieDiv.textContent = `Name: ${cookie.name}, Domain: ${cookie.domain}, Value: ${cookie.value}`;
                cookieList.appendChild(cookieDiv);
            });
        });
    });

    document.getElementById('removeThirdPartyCookies').addEventListener('click', function() {
        chrome.runtime.sendMessage({command: "removeThirdPartyCookies"}, function(response) {
            if (response.done) {
                alert('Third-party cookies have been removed!');
            }
        });
    });


    document.getElementById('allowCookies').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let currentTab = tabs[0];
            chrome.runtime.sendMessage({
                command: "setCookiePreference",
                url: currentTab.url,
                allowCookies: true
            }, (response) => {
                if (response.success) {

                } else {

                }
            });
        });
    });

    document.getElementById('denyCookies').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            let currentTab = tabs[0];
            chrome.runtime.sendMessage({
                command: "setCookiePreference",
                url: currentTab.url,
                allowCookies: false
            }, (response) => {
                if (response.success) {

                } else {

                }
            });
        });
    });

});


