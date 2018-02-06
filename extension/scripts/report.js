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
  chrome.debugger.sendCommand({tabId:tabId}, "Performance.enable");

  chrome.debugger.onEvent.addListener(onEvent);
  chrome.tabs.reload(tabId, {bypassCache: true}, null);
});

window.addEventListener("unload", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Performance.disable");
  chrome.debugger.detach({tabId:tabId});

});

function processPerformanceMetrics(result)
{
  //console.log("Performance");
  //console.log(result);
}

function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
  {
    return;
  }

  chrome.debugger.sendCommand({tabId:tabId}, "Performance.getMetrics", {}, processPerformanceMetrics);

  //console.log(message);
  if (message == "Network.requestWillBeSent") {
    processRequest(params);
  } else if (message == "Network.responseReceived") {
    processResponse(params);
  } else if (message == "DOM.documentUpdated") {
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.getDocument", {depth: -1, pierce: true}, function(root){
      //console.log(root.root);
      chrome.debugger.sendCommand({tabId:tabId}, "DOM.querySelectorAll", {nodeId: root.root.nodeId, selector: "input"}, processInputSelector);

    });
  }

}

function toggleHideEvent(e)
{
  toggleHide("urlReports");
  if (document.getElementById("urlReports").hasAttribute("hidden"))
  {
    document.getElementById("urlReports").removeAttribute("hidden");
  }
  else {
    document.getElementById("urlReports").setAttribute("hidden", '');
  }
}

function toggleHide(id)
{
  $(document.getElementById(id)).toggleClass("down");
  let element = document.getElementById(id).childNodes[1];

  if (element.hasAttribute("hidden"))
  {
    element.removeAttribute("hidden");
  }
  else {
    element.setAttribute("hidden", '');
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

function safeCheckCallback(url, result)
{
  if (result !== undefined)
  {
    // Malicious
    report[url] = content;
    let content = getUrlReportDiv(url);

    let safeReport = document.createElement("div");
    safeReport.textContent = result;
    content.appendChild(safeReport);
    let urlReports = document.getElementById("urlReports");
    if (urlReports.contains(content))
    {
      urlReports.removeChild(content);
    }
    urlReports.appendChild(content);
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
        safeCheckCallback(url, obj.matches);
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
    //console.log(nodeId);
    document.getElementById("passwordPresent").setAttribute("hidden", '');
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.resolveNode", {"nodeId": nodeId}, function(object)
    {
      let item = object.object;

      if (item.description.indexOf("pass") !== -1)
      {
        document.getElementById("passwordPresent").removeAttribute("hidden");
        //console.log("Password input detected");
      }
    });
  }
}


function getUrlReportDiv(url)
{
  let urlReportChild = document.getElementById(url);
  if (urlReportChild)
  {
    return urlReportChild;
  }

  urlReportChild = document.createElement("div");

  urlReportChild.setAttribute("id", url);
  urlReportChild.addEventListener("click", toggleHide.bind(null, url));
  urlReportChild.setAttribute("class", "hidable");

  let content = document.createTextNode( "Report for " + url + ":");
  urlReportChild.appendChild(content);
  return urlReportChild;
}

function processRequest(params)
{
  // This involves an async request so can't return a report
  sendSafeBrowsingCheck(params.request.url);
}

function processResponse(params)
{
  let url = params.response.url;
  let content = getUrlReportDiv(url);
  let urlReport = createUrlReport(url);

  let statusReport = addStatusReport(params.response.status);
  let reportToBeDisplayed = false;
  if (urlReport && urlReport.textContent !== "")
  {
    reportToBeDisplayed = true;
    content.appendChild(urlReport);
  }
  if (statusReport && statusReport.textContent !== "")
  {
    reportToBeDisplayed = true;
    content.appendChild(statusReport);
  }

  report[url] = content;
  if (reportToBeDisplayed)
  {
    let urlReports = document.getElementById("urlReports");
    // Prevent duplicates from being added
    if (urlReports.contains(content))
    {
      urlReports.removeChild(content);
    }
    urlReports.appendChild(content);
  }
}

function addStatusReport(status)
{
  let statusDiv = document.createElement("div");
  if (status >= 300 && status < 400)
  {
    numRedirects++;
    document.getElementById("numRedirects").textContent = "Number of redirects is: " + numRedirects;
    statusDiv.textContent = "Status " + status + " redirect";
  }
  else if (status >= 500)
  {
    statusDiv.textContent = "Status " + status + " failed to load";
  }
  return statusDiv;
}

function createUrlReport(url)
{
  // Only do the same URL once
  if (report[url])
  {
    return null;
  }
  let urlReport = analyse_url(url);

  let urlReportChild = document.createElement("div");
  if (urlReport && urlReport.length > 0)
  {
    for (let i in urlReport)
    {
      let finding = document.createElement("div");
      finding.textContent = urlReport[i];
      urlReportChild.appendChild(finding);
    }
  }
  return urlReportChild;
}

let specialCharacters = ['<','>','#','{','}','|','\\','^','~','[',']',/*'?','%'*/, '@'];
function analyse_url(url)
{
  let report = [];
  //console.log("Matching with: " + url);

  let parser = decomposeUrl(url);
  //console.log("Decomposed:");
  //console.log(parser.protocol); // => "http:"
  //console.log(parser.hostname); // => "example.com" also domain
  if (parser.port)
  {
    report.push("Port is: " + parser.port);     // => "3000"
  }
  //console.log(parser.host);     // => "example.com:3000"
  //console.log(parser.pathname); // => "/pathname/"
  //console.log(parser.search);   // => "?search=test"
  //console.log(parser.hash);     // => "#hash"

  if (isPureIPAddress(parser.hostname))
  {
    //console.log("Matches");
    report.push("Contains pure IP address");
  }
  else {
    //console.log("Does not match");
    let found = [];
    for (let i in specialCharacters)
    {
      if (url.indexOf(specialCharacters[i]) !== -1)
      {
        //console.log("Special character: " + specialCharacters[i] + " found in URL " + url);
        found.push(specialCharacters[i]);
      }
    }
    if (found.length > 0)
    {
      report.push("Special characters: " + found.toString());
    }
  }
  return report;
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
