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
  document.getElementById("reportsToggle").addEventListener("click", toggleHide)
  //clear();
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.enable");
  chrome.debugger.onEvent.addListener(onEvent);
  chrome.tabs.reload(tabId, {bypassCache: true}, null);
});

window.addEventListener("unload", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.disable");
  chrome.debugger.detach({tabId:tabId});

});

function toggleHide(e)
{
  if (document.getElementById("urlReports").hasAttribute("hidden"))
  {
    document.getElementById("urlReports").removeAttribute("hidden");
  }
  else {
    document.getElementById("urlReports").setAttribute("hidden", '');
  }
}

function clear(e)
{
  numRedirects = 0;
  report = {};
  document.getElementById("numRedirects").textContent = "The number of redirects is: 0";
  document.getElementById("passwordPresent").textContent = "There is a password form present";
  document.getElementById("passwordPresent").setAttribute("hidden", '');
  let node = document.getElementById("urlReports");
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}

function sendSafeBrowsingCheck(url)
{
  // How to send Post request + do something with result
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
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
    let child = document.createElement("div");
    child.textContent = "Report: " + urlReport + " for " + url + '\n';
    child.setAttribute("class", "request");
    document.getElementById("urlReports").appendChild(child);
  }
}

let specialCharacters = ['<','>','#','{','}','|','\\','^','~','[',']',/*'?','%',*/ '@'];
function analyse_url(url)
{
  let report = "";
  console.log("Matching with: " + url);

  if (isPureIPAddress(url))
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

let regex = /^(http:\/\/|https:\/\/|)\d+\.\d+\.\d+\.\d+.*$/;
function isPureIPAddress(testString)
{
  return regex.test(testString);
}

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
