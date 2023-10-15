chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    var currentTab = tabs[0];
    var currentUrl = new URL(currentTab.url);
    console.log(currentUrl);
    if(currentUrl.protocol === "https:"){
        console.log("good protocol");
        document.getElementById("https_").style.backgroundColor = "green";
    } else {
        console.log("bad protocol");
        document.getElementById("https_").style.backgroundColor = "red";
    }
});
