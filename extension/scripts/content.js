// content.js

window.addEventListener ("load", onLoad, false);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //alert(request);
  //console.dir(request);
});

document.addEventListener("hookEvent", function(event) {
  event.stopPropagation();
  console.log("triggered!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.dir(event);

  // Pass the custom message that's passed in through the event
  chrome.runtime.sendMessage({
    message: event.detail.message,
    data: event.detail.data
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
     injectWindowOpenHook(extensionId);
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
      document.honeyBrowserEvent = new CustomEvent('hookEvent', {
        cancelable: true,
        bubbles: false,
        detail: {
          message: "notificationsRequested",
          data: detailObj
        }
      });
      document.honeyBrowserEvent.initEvent('hookEvent');
      document.dispatchEvent(document.honeyBrowserEvent);
      return store(callback);
    };
  };
  injectFunction(functionToInject, extensionId);
}

function injectWindowOpenHook(extensionId)
{
  let functionToInject = function(extensionId)
  {
    let store = window.open;
    window.open = function(url, windowName) {
      let detailObj = {};
      detailObj.iniatiatorUrl = document.location.href;
      document.honeyBrowserEvent = new CustomEvent('Event', {detail: {
        message: "windowOpen",
        data: detailObj
      }});
      document.honeyBrowserEvent.initEvent('hookEvent');
      document.dispatchEvent(document.honeyBrowserEvent);
      return store(arguments);
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

var ListenerTracker=new function(){
    var is_active=false;
    // listener tracking datas
    var _elements_  =[];
    var _listeners_ =[];
    this.init=function(){
        if(!is_active){//avoid duplicate call
            intercep_events_listeners();
        }
        is_active=true;
    };
    // register individual element an returns its corresponding listeners
    var register_element=function(element){
        if(_elements_.indexOf(element)==-1){
            // NB : split by useCapture to make listener easier to find when removing
            var elt_listeners=[{/*useCapture=false*/},{/*useCapture=true*/}];
            _elements_.push(element);
            _listeners_.push(elt_listeners);
        }
        return _listeners_[_elements_.indexOf(element)];
    };
    var intercep_events_listeners = function(){
        // backup overrided methods
        var _super_={
            "addEventListener"      : HTMLElement.prototype.addEventListener,
            "removeEventListener"   : HTMLElement.prototype.removeEventListener
        };

        Element.prototype["addEventListener"]=function(type, listener, useCapture){
            var listeners=register_element(this);
            // add event before to avoid registering if an error is thrown
            _super_["addEventListener"].apply(this,arguments);
            // adapt to 'elt_listeners' index
            useCapture=useCapture?1:0;

            if(!listeners[useCapture][type])listeners[useCapture][type]=[];
            listeners[useCapture][type].push(listener);
        };
        Element.prototype["removeEventListener"]=function(type, listener, useCapture){
            var listeners=register_element(this);
            // add event before to avoid registering if an error is thrown
            _super_["removeEventListener"].apply(this,arguments);
            // adapt to 'elt_listeners' index
            useCapture=useCapture?1:0;
            if(!listeners[useCapture][type])return;
            var lid = listeners[useCapture][type].indexOf(listener);
            if(lid>-1)listeners[useCapture][type].splice(lid,1);
        };
        Element.prototype["getEventListeners"]=function(type){
            var listeners=register_element(this);
            // convert to listener datas list
            var result=[];
            for(var useCapture=0,list;list=listeners[useCapture];useCapture++){
                if(typeof(type)=="string"){// filtered by type
                    if(list[type]){
                        for(var id in list[type]){
                            result.push({"type":type,"listener":list[type][id],"useCapture":!!useCapture});
                        }
                    }
                }else{// all
                    for(var _type in list){
                        for(var id in list[_type]){
                            result.push({"type":_type,"listener":list[_type][id],"useCapture":!!useCapture});
                        }
                    }
                }
            }
            return result;
        };
    };
}();
ListenerTracker.init();

onLoad();
