// content.js

window.addEventListener("load", onLoad, false);
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event)
{
    if (!event.data.honey) {
      return;
    }
    console.log(event.data.message);

    chrome.runtime.sendMessage({
      message: event.data.message,
      data: event.data.data
    });
}

function onLoad(e) {
  window.honeyBrowserEvent = {};
  chrome.runtime.sendMessage({
    "message": "hasLoaded"
  });

  chrome.runtime.sendMessage({
      "message": "getExtensionId"
    },
    function(response) {
      if (!response) {
        return;
      }
      let extensionId = response.extensionId;
      injectChromeWebstoreInstallHook(extensionId);
      injectNotificationHook(extensionId);
      injectWindowOpenHook(extensionId);
      injectElementDispatchEventHook(extensionId);
    });
}


function injectWindowOpenHook(extensionId) {
  let functionToInject = function(extensionId) {
    let store = window.open;
    window.open = function(url, windowName) {
      let data = {
        honey: true,
        message: "windowOpen",
        data: {
          iniatiatorUrl: document.location.href
        }
      };
      window.postMessage(data, "*");
      return store.apply(this, arguments);
    };
  };
  injectFunction(functionToInject, extensionId);
}




function injectNotificationHook(extensionId) {
  let functionToInject = function(extensionId) {
    let store = Notification.requestPermission;
    Notification.requestPermission = function(callback) {
      let data = {
        honey: true,
        message: "notificationsRequested",
        data: {
          iniatiatorUrl: document.location.href
        }
      };
      window.postMessage(data, "*");
      return store.apply(this, arguments);
    };
  };
  injectFunction(functionToInject, extensionId);
}

function injectElementDispatchEventHook(extensionId) {
  let functionToInject = function(extensionId) {
    let store = Element.prototype.dispatchEvent;
    Element.prototype.dispatchEvent = function(name, cb) {
      if (!name.isTrusted) {
          let data = {
            honey: true,
            message: "ElementDispatchEvent",
            data: {
              iniatiatorUrl: document.location.href
            }
          };
          window.postMessage(data, "*");
      }


      return store.apply(this, arguments);
    };
  };
  injectFunction(functionToInject, extensionId);
}

function injectChromeWebstoreInstallHook(extensionId) {
  let functionToInject = function(extensionId) {
    let store = chrome.webstore.install;
    chrome.webstore.install = function(url, onSuccess, onFailure) {
      let data = {
        honey: true,
        message: "extensionInstallStarted",
        data: {
          webstoreUrl: url,
          iniatiatorUrl: document.location.href
        }
      }
      window.postMessage(data, "*");
      return store.apply(this, arguments);
    };
  };
  injectFunction(functionToInject, extensionId);
}

function injectFunction(functionToInject, extensionId) {
  let code = '(' + functionToInject + ')(' + JSON.stringify(extensionId) + ');';
  let script = document.createElement("script");
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

onLoad();
