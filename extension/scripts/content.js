// content.js

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "onHeadersReceived" ) {
      var firstHref = $("a[href^='http']").eq(0).attr("href");
      //console.log(request.message);

      if (request.data[0].value >= 300 && request.data[0].value < 400) {
        console.log("Redirect");
        console.log(request.data[0]);
      }
    }
  }
);
