chrome.webRequest.onHeadersReceived.addListener(function(details){
  console.log(details.responseHeaders);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      "message": "onHeadersReceived",
      "data": details.responseHeaders
    });
  });
}, {urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);

chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    console.log(details);
    return {};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestBody"]);



console.log("background");
