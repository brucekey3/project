// content.js

window.addEventListener ("load", onLoad, false);

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
   });

   for (form of document.forms)
   {
     for (field of form)
     {
       console.dir(field);
       if (field.type && field.type !== "hidden" && field.type !== "submit")
       {
         field.value = "Hello";
       }
     }
     //form.submit();
     let detailObj  = {
       testValue: "yep"
     };
     let event = new CustomEvent('Event', {detail: {message: "formsProcessed", data: detailObj}});
     event.initEvent('hookEvent');
     document.dispatchEvent(event);
   }
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
      let event = new CustomEvent('Event', {detail: {message: "extensionInstallStarted", data: detailObj}});
      event.initEvent('hookEvent');
      document.dispatchEvent(event);
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
