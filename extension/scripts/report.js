// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
let API_KEY = "AIzaSyBkdzT2k1HcVtyqMUr3v4Lkpswv8WfvyeQ";
let tabId = parseInt(window.location.search.substring(1));
let report = {};
let numRedirects = 0;
let redirectThreshold = 1;

window.addEventListener("load", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.enable");
  chrome.debugger.onEvent.addListener(onEvent);

});

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
      "platformTypes":    ["LINUX"],
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
  for (let id in nodeIds)
  {
    let nodeId = nodeIds[id];
    console.log(nodeId);
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
    let pureIpElem = document.getElementById("pureIp");
    if (pureIpElem.textContent === "No pure IP addresses")
    {
      pureIpElem.textContent = "";
    }
    pureIpElem.textContent += url + " Report: " + urlReport + '\n';
  }
}

let regex = /\d+\.\d+\.\d+\.\d+/;
let specialCharacters = ['<','>','#','%','{','}','|','\\','^','~','[',']',/*'?'*/, '@'];
function analyse_url(url)
{
  let report = "";
  console.log("Matching with: " + url);

  if (regex.test(regex))
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


function display_report()
{
  chrome.runtime.getBackgroundPage(function(bgWindow) {
        report = bgWindow.getReport(tabId);
        var reportDiv = document.createElement("div");
        reportDiv.className = "request";
        reportDiv.textContent = report.urlReport;
        console.log("Report is: " + report);
        document.getElementById("container").appendChild(reportDiv);
  });
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
