// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
let API_KEY = "AIzaSyBkdzT2k1HcVtyqMUr3v4Lkpswv8WfvyeQ";
let tabId = parseInt(window.location.search.substring(1));
let report = {};
let numRedirects = 0;
let redirectThreshold = 1;

window.addEventListener("load", function() {
  document.getElementById("clearBtn").addEventListener("click", clear);
  //clear();
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.enable");
  chrome.debugger.onEvent.addListener(onEvent);

});

function clear()
{
  numRedirects = 0;
  report = {};
  document.getElementById("numRedirects").textContent = "The number of redirects is: 0";
  document.getElementById("passwordPresent").textContent = "There is a password form present";
  document.getElementById("passwordPresent").setAttribute("hidden", '');
  document.getElementById("urlReports").textContent = "";
}

function sendSafeBrowsingCheck(url)
{
  // How to send Post request + do something with result
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status != 420) {
         // Typical action to be performed when the document is ready:

         let obj = JSON.parse(xhttp.responseText);
         console.log(obj);
         if (obj.matches === undefined)
         {
           console.log(url + " is safe");
         }
         else {
           console.log(url + " is malicious");
         }
      }
  };
  xhttp.open("POST", "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + API_KEY);
  xhttp.setRequestHeader('Content-type', 'application/json');
  requestBody = {
    "client": {
      "clientId":      "HoneyBrowser",
      "clientVersion": "0.0.1"
    },
    "threatInfo": {
      "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
      "platformTypes":    ["LINUX", "WINDOWS"],
      "threatEntryTypes": ["URL"],
      "threatEntries": [
        {"url": url}
      ]
    }
  };
  xhttp.send();
}

window.addEventListener("unload", function() {
  chrome.debugger.detach({tabId:tabId});
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.disable");

});

function processInputSelector(nodeIdResults)
{
  let nodeIds = nodeIdResults.nodeIds;
  // Reset the presence of a password field


  for (let id in nodeIds)
  {
    let nodeId = nodeIds[id];
    console.log(nodeId);
    document.getElementById("passwordPresent").setAttribute("hidden", '');
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.resolveNode", {"nodeId": nodeId}, function(object)
    {
      let item = object.object;

      if (item.description.indexOf("pass") !== -1)
      {
        document.getElementById("passwordPresent").removeAttribute("hidden");
        console.log("Password input detected");
      }
    });
  }
}

function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;
  console.log(message);
  if (message == "Network.requestWillBeSent") {
    processRequest(params);
  } else if (message == "Network.responseReceived") {
    processResponse(params);
  } else if (message == "DOM.documentUpdated") {
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.getDocument", {depth: -1, pierce: true}, function(root){
      console.log(root.root);
      chrome.debugger.sendCommand({tabId:tabId}, "DOM.querySelectorAll", {nodeId: root.root.nodeId, selector: "input"}, processInputSelector);

    });
  }

}

function processRequest(params)
{
  sendSafeBrowsingCheck(params.request.url);
}

function processResponse(params)
{
  addUrlReport(params.response.url);
  addStatusReport(params.response.status);

}

function addStatusReport(status)
{
  if (status >= 300 && status < 400)
  {
    numRedirects++;
    document.getElementById("numRedirects").textContent = "Number of redirects is: " + numRedirects;
  }
}

function addUrlReport(url)
{
  // Only do the same URL once
  if (report[url])
  {
    return;
  }
  let urlReport = analyse_url(url);
  report[url] = urlReport;
  if (urlReport && urlReport.length > 0)
  {
    document.getElementById("urlReports").textContent += "\n Report: " + urlReport + " for " + url + '\n';
  }
}

let regex = /\d+\.\d+\.\d+\.\d+/;
let specialCharacters = ['<','>','#','%','{','}','|','\\','^','~','[',']',/*'?'*/, '@'];
function analyse_url(url)
{
  let report = "";
  console.log("Matching with: " + url);

  if (regex.test(url))
  {
    console.log("Matches");
    report += "Matches IP address";
  }
  else {
    console.log("Does not match");
    let found = [];
    for (let i in specialCharacters)
    {
      if (url.indexOf(specialCharacters[i]) !== -1)
      {
        console.log("Special character: " + specialCharacters[i] + " found in URL " + url);
        found.push(specialCharacters[i]);
      }
    }
    if (found.length > 0)
    {
      report += "Special characters: " + found.toString();
    }
  }
  return report;
}

/*
148.163.101.199/pall

https://r4---sn-cu-aigse.googlevideo.com/videoplayback?lmt=1516167657281451&ipbits=0&mn=sn-cu-aigse&mm=31&ip=109.150.54.170&gir=yes&pl=25&aitags=133%2C134%2C135%2C136%2C137%2C160%2C242%2C243%2C244%2C247%2C248%2C278&mime=video%2Fwebm&id=o-AMi1kX2rvOc7MNIkuS27WX7x-sXdnYgyc7HbBPms3-gd&ms=au&mv=m&sparams=aitags%2Cclen%2Cdur%2Cei%2Cgir%2Cid%2Cinitcwndbps%2Cip%2Cipbits%2Citag%2Ckeepalive%2Clmt%2Cmime%2Cmm%2Cmn%2Cms%2Cmv%2Cpl%2Crequiressl%2Csource%2Cexpire&mt=1517081003&itag=244&keepalive=yes&requiressl=yes&signature=0661FDC91AEC9833CC6F79B0573AC768E2E430CE.BFB060495695D0F5B91D7F06DB033F0D2811E86B&ei=-dFsWqWSIcjuW-KNs5gE&expire=1517102681&key=yt6&dur=1564.163&clen=96474191&initcwndbps=1358750&source=youtube&ratebypass=yes&alr=yes&cpn=a0dSW5qjztP15ZHu&c=WEB&cver=2.20180125&range=0-216033&rn=0&rbuf=0
*/

function parseURL(url) {
  var result = {};
  var match = url.match(
      /^([^:]+):\/\/([^\/:]*)(?::([\d]+))?(?:(\/[^#]*)(?:#(.*))?)?$/i);
  if (!match)
    return result;
  result.scheme = match[1].toLowerCase();
  result.host = match[2];
  result.port = match[3];
  result.path = match[4] || "/";
  result.fragment = match[5];
  return result;
}
