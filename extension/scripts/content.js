// content.js

window.addEventListener ("load", onLoad, false);

document.addEventListener("hookEvent", function(data) {
  // Pass the custom message that's passed in through the event
  chrome.runtime.sendMessage({
    message: data.message,
    data: data.detail
  });
});

function onLoad(e) {
  chrome.runtime.sendMessage({
      "message": "hasLoaded"
  });

  chrome.runtime.sendMessage({"message": "getExtensionId"} ,
   function(response)
   {
     let extensionId = response.extensionId;
     injectChromeWebstoreInstallHook(extensionId);
   });

}

function injectChromeWebstoreInstallHook(extensionId)
{
  let functionToInject = function(extensionId)
  {
    let store = chrome.webstore.install;
    chrome.webstore.install = function(url, onSuccess, onFailure) {
      let detailObj = {};
      detailObj.webstoreUrl = url;
      detailObj.iniatiatorUrl = document.location.href;
      let event = new CustomEvent('Event', {message: "extensionInstallStarted" , detail: detailObj});
      event.initEvent('hookEvent');
      document.dispatchEvent(event);
      return store(url, onSuccess, onFailure);
    };
  };
  injectFunction(functionToInject);
}

function injectFunction(functionToInject)
{
  let code = '(' + functionToInject + ')(' + JSON.stringify(extensionId) + ');';
  let script = document.createElement("script");
  script.textContent = code;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
}
