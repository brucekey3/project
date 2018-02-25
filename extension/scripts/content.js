// content.js

window.addEventListener ("load", onLoad, false);

function onLoad(e) {
    chrome.runtime.sendMessage({data: "hasLoaded"});
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

  }
});
