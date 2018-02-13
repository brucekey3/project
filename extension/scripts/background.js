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
    if (request.message === "createReportWindow") {
      console.log("createReportWindow message received");

      let tabId = request.data;
      let debuggeeId = {tabId: tabId};

      chrome.debugger.attach(debuggeeId,
                             version,
                             onAttachReport.bind(null, tabId));


    }

    return true;
});

console.log("background");
