/*
chrome.webRequest.onHeadersReceived.addListener(function(details){
  console.log("Headers:")
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
*/
var version = "1.0";

chrome.browserAction.onClicked.addListener(function(tab) {
  //console.log(tab);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    let id = activeTab.id;
    console.log(id);
    chrome.tabs.sendMessage(id, {
        "message": "browserAction_clicked",
        "data": id
    });
  });
});

function onAttach(tabId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  chrome.windows.create(
      {url: "html/headers.html?" + tabId,
       type: "popup",
       width: 800, height: 600});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "openWindow" ) {
      let id = request.data;
      console.log(request);

      chrome.debugger.attach({tabId: id}, version,
          onAttach.bind(null, id)
      );
    }

});

console.log("background");
