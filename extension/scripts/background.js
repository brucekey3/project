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
let extensionId = undefined;

function onAttachReport(tabId)
{
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  chrome.windows.create(
     {url: "html/report.html?" + tabId,
      type: "popup",
      width: 800, height: 600});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request.message);
    if (request.message === "createReportWindow") {
      console.log("createReportWindow message received");

      let tabId = request.data;
      let debuggeeId = {tabId: tabId};

      chrome.debugger.attach(debuggeeId,
                             version,
                             onAttachReport.bind(null, tabId));


    }
    else if (request.message === "hasLoaded")
    {
      let tabId = sender.tab.id;
    }
    // Basically just pass through here and send data to the
    // report.js so the report can be added
    else if (request.message ===  "extensionInstallStarted")
    {
      let tabId = sender.tab.id;
      console.log("Message received: " + request.data);
      chrome.tabs.sendMessage(tabId, {
        "message": "extensionInstallStarted",
        "data": request.data
      });
    }
    else if (request.message === "getExtensionId")
    {
      sendResponse({extensionId: extensionId});
    }

    return true;
});

console.log("background");
chrome.management.getSelf(function(result) {
  console.log(result.id);
  extensionId = result.id;
});
