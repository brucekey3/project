
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

var version = "1.0";

chrome.browserAction.onClicked.addListener(function(tab) {
  console.log(tab);
});

function onAttachOpenWindow(tabId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  var debuggeeId = {tabId: tabId};
  console.log("Enabled");
  chrome.debugger.sendCommand(debuggeeId, "Debugger.enable", {}, null);
  console.log("Opening Window");
  chrome.windows.create(
     {url: "html/headers.html?" + tabId,
      type: "popup",
      width: 800, height: 600});
}

function onAttachPause(tabId) {

  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  var debuggeeId = {tabId: tabId};
  chrome.debugger.sendCommand(debuggeeId, "Debugger.enable", {}, null);
  console.log("Enabled");
  chrome.debugger.sendCommand(debuggeeId, "Debugger.pause");
  console.log("Paused");
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "openWindow" ) {
      let id = request.data;
      console.log(request);
      chrome.debugger.attach({tabId: id}, version,
          onAttachOpenWindow.bind(null, id)
      );

    }
    else if (request.message === "pauseExecution") {
      let id = request.data;
      chrome.debugger.attach({tabId: id}, version,
          onAttachPause.bind(null, id)
      );
    }

});


console.log("background");
