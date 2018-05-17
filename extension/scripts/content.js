// content.js

window.addEventListener ("load", onLoad, false);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //alert(request);
  console.dir(request);
});

document.addEventListener("hookEvent", function(data) {
  console.log("triggered!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.dir(data);
  // Pass the custom message that's passed in through the event
  chrome.runtime.sendMessage({
    message: data.detail.message,
    data: data.detail.data
  });
});

function onLoad(e) {
  document.honeyBrowserEvent = {};
  chrome.runtime.sendMessage({
      "message": "hasLoaded"
  });

  chrome.runtime.sendMessage({"message": "getExtensionId"} ,
   function(response)
   {
     if (!response)
     {
       return;
     }
     let extensionId = response.extensionId;
     injectChromeWebstoreInstallHook(extensionId);
     injectNotificationHook(extensionId);
   });

}

function injectNotificationHook(extensionId)
{
  let functionToInject = function(extensionId)
  {
    let store = Notification.requestPermission;
    Notification.requestPermission = function(callback) {
      let detailObj = {};
      detailObj.iniatiatorUrl = document.location.href;
      document.honeyBrowserEvent = new CustomEvent('Event', {detail: {
        message: "notificationsRequested",
        data: detailObj
      }});
      document.honeyBrowserEvent.initEvent('hookEvent');
      document.dispatchEvent(document.honeyBrowserEvent);
      return store(callback);
    };
  };
  injectFunction(functionToInject, extensionId);
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
      document.honeyBrowserEvent = new CustomEvent('Event', {detail: {
        message: "extensionInstallStarted",
        data: detailObj
      }});
      document.honeyBrowserEvent.initEvent('hookEvent');
      document.dispatchEvent(document.honeyBrowserEvent);
      return store(url, onSuccess, onFailure);
    };
  };
  injectFunction(functionToInject, extensionId);
}

function injectFunction(functionToInject, extensionId)
{
  let code = '(' + functionToInject + ')(' + JSON.stringify(extensionId) + ');';
  let script = document.createElement("script");
  script.textContent = code;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
}

onLoad();
