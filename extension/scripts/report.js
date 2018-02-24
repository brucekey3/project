// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
let API_KEY = "AIzaSyBkdzT2k1HcVtyqMUr3v4Lkpswv8WfvyeQ";
let tabId = parseInt(window.location.search.substring(1));
let report = {};
let numRedirects = 0;
let redirectThreshold = 1;

function beginAnalysis()
{
  chrome.tabs.reload(tabId, {bypassCache: true}, function() {
    chrome.debugger.onEvent.addListener(onEvent);
    chrome.debugger.sendCommand({tabId:tabId}, "Performance.getMetrics", {}, processPerformanceMetrics);
    chrome.debugger.sendCommand({tabId:tabId}, "Profiler.setSamplingInterval", {interval: 100}, null);
    chrome.debugger.sendCommand({tabId:tabId}, "Profiler.startPreciseCoverage", {callCount: true, detailed: true}, function(){
        chrome.debugger.sendCommand({tabId:tabId}, "Profiler.start", {}, function() {
            window.setTimeout(stop, 10000);
        });
    });

    chrome.downloads.onCreated.addListener(downloadCreatedCallback);

    chrome.system.cpu.getInfo(function (res){
      for (let i in res.processors)
      {
        lastUserUsage[i] = res.processors[i].usage.user;
        lastKernelUsage[i] = res.processors[i].usage.kernel;
        lastIdleUsage[i] = res.processors[i].usage.idle;
        lastTotalUsage[i] = res.processors[i].usage.total;
      }
      // Give the page some time to load
      window.setTimeout(monitorCpuUsage.bind(null, 0), 100)
    });
  });

}

window.addEventListener("load", function() {
  document.getElementById("clearBtn").addEventListener("click", clear);
  document.getElementById("reportsToggle").addEventListener("click", toggleHide)
  //clear();
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Performance.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Security.enable");

  // Give the debugger time to set up
  window.setTimeout(beginAnalysis, 100);
});

window.addEventListener("unload", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Performance.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.stopPreciseCoverage", {}, null);
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Security.disable");
  chrome.debugger.detach({tabId:tabId});

});

/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let id = sender.tab.id;
  if (id != tabId)
  {
    return;
  }
  console.log("Page has loaded");
  sendStaticAnalysisMessage();
});
*/

let lastUserUsage = [];
let lastKernelUsage = [];
let lastIdleUsage = [];
let lastTotalUsage = [];

function monitorCpuUsage(lastUsage)
{
  chrome.system.cpu.getInfo(function (res){
    //console.log(res);
    let resourcesDiv = document.getElementById("resources");
    while (resourcesDiv.hasChildNodes()) {
      resourcesDiv.removeChild(resourcesDiv.lastChild);
    }

    for (let i in res.processors)
    {
      let userUsage = res.processors[i].usage.user
      let kernelUsage = res.processors[i].usage.kernel
      let idleUsage = res.processors[i].usage.idle
      let totalUsage = res.processors[i].usage.total

      let totalUsageDiff  =  totalUsage  - lastTotalUsage[i];

      let userUsagePercentage   = ((userUsage   - lastUserUsage[i])  / totalUsageDiff)*100;
      let kernelUsagePercentage = ((kernelUsage - lastKernelUsage[i])/ totalUsageDiff)*100;
      let idleUsagePercentage   = ((idleUsage   - lastIdleUsage[i])  / totalUsageDiff)*100;

      let user   = document.createElement("div");
      user.textContent = "User usage: " + userUsagePercentage + "%";
      let kernel = document.createElement("div");
      kernel.textContent = "Kernel usage: " + kernelUsagePercentage + "%";
      let idle   = document.createElement("div");
      idle.textContent = "Idle usage: " + idleUsagePercentage + "%";

      if (userUsagePercentage > 70)
      {
        user.style.backgroundColor = "red";
        let warning = document.createElement("div");
        warning.style.backgroundColor = "red";
        warning.textContent = "Warning - high CPU usage. "
                            + "This site may be mining cryptocurrency.";
        resourcesDiv.appendChild(warning);
        resourcesDiv.appendChild(document.createElement("br"));
      }

      resourcesDiv.appendChild(user);
      resourcesDiv.appendChild(document.createElement("br"));
      resourcesDiv.appendChild(kernel);
      resourcesDiv.appendChild(document.createElement("br"));
      resourcesDiv.appendChild(idle);

      lastUserUsage[i]   = userUsage;
      lastKernelUsage[i] = kernelUsage;
      lastIdleUsage[i]   = idleUsage;
      lastTotalUsage[i]  = totalUsage;
    }

    window.setTimeout(monitorCpuUsage.bind(null, 0), 2000)
  });
}

function stop()
{
  console.log("Stop");
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.stop", {}, processProfilerResults)
}


/*
*     START OF CALLBACKS
*/

// Called when a download starts
function downloadCreatedCallback(downloadItem)
{
  alert("Download is starting!!");
  console.dir(downloadItem);
}

function processPerformanceMetrics(result)
{
  //console.log("Performance");
  //console.dir(result);
  for (let i in result.metrics)
  {
    let metricObj = result.metrics[i];
    if (metricObj.name === "JSHeapUsedSize")
    {
      console.log("JSHeapUsedSize: " + metricObj.value);
    }
  }
}

function sendStaticAnalysisMessage()
{
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //console.log(tabId);
    //console.log(tabs[0].id);
    chrome.tabs.sendMessage(tabId, {request: "static_analysis"}, {}, function(response) {
      //console.dir(response);
      if (response && response.analysis)
      {
        let analysisArray = response.analysis;
        //console.log("Scripts: " + analysisArray.length);
        for (let analysis of analysisArray)
        {
          if (analysis.install && analysis.install > 0){
            console.log("This page may install an extension");
          }
        }
      }
    });
  });
}
let responses = {};
function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
  {
    return;
  }

  //console.log(message);
  if (message == "Network.requestWillBeSent") {
    processRequest(params);
  } else if (message == "Network.responseReceived") {
    responses[params.requestId] = params;
  } else if (message === "Network.loadingFinished") {
    let responseParams = responses[params.requestId];
    processResponse(responseParams);
  } else if (message == "DOM.documentUpdated") {
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.getDocument", {depth: -1, pierce: true}, function(root){
      //console.log(root.root);
      chrome.debugger.sendCommand({tabId:tabId}, "DOM.querySelectorAll", {nodeId: root.root.nodeId, selector: "input"}, processInputSelector);

    });
  }
  else if (message == "Security.securityStateChanged") {
    processSecurityStateChanged(params);
  }
  // Note: this may be deprecated
  else if (message == "Security.certificateError") {
    processCertificateError(params);
  }
  else if (message == "Performance.metrics") {
    processPerformanceMetrics(params);
  }
  else if (message == "Profiler.consoleProfileFinished")
  {
    processProfilerResults(params);
  }

}

function processProfilerResults(results)
{
  //console.log("Profiler");
  //console.dir(results);
}

// TODO: Change this to check if container is present?
function processCertificateError(params)
{
  let id = eventId;
  let errorType = params.errorType
  let requestURL = params.requestURL;
  let reportObj = getDomainReportContainer(requestURL);
  let urlReports = document.getElementById("urlReports");

  let report = [].push(generateReport("Certificate error: " + errorType,
                                      SeverityEnum.SEVERE));
  reportObj.addDomainReport(report);
  console.log("CERTIFICATE ERROR");
  alert("certificate error");
}

function processSecurityStateChanged(params)
{
  // unknown, neutral, insecure, secure, info
  let securityState = params.securityState;
  let schemeIsCryptographic = params.schemeIsCryptographic;

  // securityState, title, summary, description, mixedContentType, certificate
  let explanations = params.explanations;
  let insecureContentStatus = params.insecureContentStatus;
  let summary = params.summary;

  let div = document.getElementById("securityState");
  // Use this to create new lines
  while (div.hasChildNodes()) {
    div.removeChild(div.lastChild);
  }
  if (securityState !== "unknown")
  {
    let state = document.createElement("span");
    state.textContent = "Security state is: " + securityState;
    switch (securityState)
    {
      case "neutral":
        setSeverityAttributes(state, SeverityEnum.MILD);
        break;
      case "insecure":
        setSeverityAttributes(state, SeverityEnum.HIGH);
        break;
      case "secure":
        break;
      case "info":
        break;
      default:
        break;
    }
    div.appendChild(state);
    div.appendChild(document.createElement("br"));
  }

  let isCryptographic = document.createElement("span");
  if (schemeIsCryptographic)
  {
    isCryptographic.textContent = "Page was loaded securely.";
  }
  else
  {
    isCryptographic.textContent = "Page was loaded insecurely.";
    setSeverityAttributes(isCryptographic, SeverityEnum.HIGH);
  }
  div.appendChild(isCryptographic);
  div.appendChild(document.createElement("br"));
  //console.log("Security state changed");
  //console.log(params);
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
  containers = {};
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
  //console.log("Checked: " + url);
  //console.log("Got: " + result);
  if (result !== undefined)
  {
    // Malicious
    let containerObject = getDomainReportContainer(url);

    let parser = decomposeUrl(url);
    containerObject.addPathnameReport(parser.pathname, safeReport);

    report[url] = containerObject;
  }
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

/*
*     END OF CALLBACKS
*/

function sendSafeBrowsingCheck(url)
{
  if (url && url.length == 0)
  {
    console.log("Cannot check empty URL");
    return;
  }
  // How to send Post request + do something with result
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
         // Typical action to be performed when the document is ready:

        let obj = JSON.parse(xhttp.responseText);
        //console.log(xhttp.responseText);
        safeCheckCallback(url, obj.matches);
      }
  };
  xhttp.open("POST", "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + API_KEY);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  requestBody = {
   "client": {
     "clientId":      "HoneyBrowser",
     "clientVersion": "0.0.1"
   },
   "threatInfo": {
     "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
     "platformTypes":    ["LINUX", "WINDOWS"],
     "threatEntryTypes": ["URL"],
     "threatEntries": [{"url": url}]
   }
  };
  xhttp.send(JSON.stringify(requestBody));
}


function processRequest(params)
{
  // This involves an async request so can't return a report
  sendSafeBrowsingCheck(params.request.url);
}

function processResponse(params)
{
  let url = params.response.url;
  let urlReport = createUrlReport(url);

  // If we have already done this url then null is returned and we should
  // not bother performing any analysis on it
  if (!urlReport)
  {
    return;
  }
  let container = getDomainReportContainer(url);
  let reportToBeDisplayed = false;

  if (urlReport.domain && urlReport.domain.length > 0)
  {
    //console.log("Url: " + url);
    //console.dir(urlReport.domain);
    //console.log("");
    reportToBeDisplayed = true;
    container.addDomainReport(urlReport.domain);
  }

  let parser = decomposeUrl(url);
  let pathname = parser.pathname;
  // Status report will be per unique URL i.e. combination of domain and path
  let statusReport = addStatusReport(params.response.status);
  if (statusReport && statusReport.length > 0)
  {
    reportToBeDisplayed = true;
    // If we have a report for this pathname then add the status report to that
    if (urlReport.pathname)
    {
      urlReport.pathname = urlReport.pathname.concat(statusReport);
    }
    // Otherwise create a report just for the status
    else {
      container.addPathnameReport(pathname, statusReport);
    }
  }

  if (urlReport.pathname && urlReport.pathname.length > 0)
  {
    //console.log("Url22: " + url);
    //console.dir(urlReport.pathname);
    //console.log("");
    reportToBeDisplayed = true;
    container.addPathnameReport(pathname, urlReport.pathname);
  }

  let scriptReport = [];
  let resourceType = params.type;
  /*
    Document, Stylesheet, Image, Media, Font, Script, TextTrack,
    XHR, Fetch, EventSource, WebSocket, Manifest, Other
  */
  //console.log(resourceType);

  if (resourceType === "Script" || resourceType === "Document")
  {

    //console.log("Script Found: " + numScripts);
    //console.dir(params.response.mimeType);
    /*
    if (params.response.mimeType === "application/javascript"
     || params.response.mimeType === "text/javascript")
    {*/
      //console.log("javascript found");
      chrome.debugger.sendCommand({tabId: tabId}, "Network.getResponseBody", {"requestId": params.requestId}, function(result) {
        console.dir(result);
        if (!result)
        {
          console.log("Empty response body");
          return;
        }
        let base64Encoded = result.base64Encoded;
        let script = result.body;
        if (base64Encoded)
        {
          console.log("SCRIPT IS base64Encoded");
        }

        scriptReport = createScriptReport(script);
        if (scriptReport.length > 0)
        {
          reportToBeDisplayed = true;
          container.addPathnameReport(pathname, scriptReport);
        }
        //console.dir(scriptReport);
      });
    }
  //}



  report[url] = container;
  /*
  if (reportToBeDisplayed)
  {
    let urlReports = document.getElementById("urlReports");
    // Prevent duplicates from being added
    if (urlReports.contains(container.domainContainer))
    {
      urlReports.removeChild(container.domainContainer);
    }
    urlReports.appendChild(container.domainContainer);
  }
  */
}

function createScriptReport(script)
{
  let report = []
  let analysis = static_analysis(script);
  console.dir(analysis);
  if (analysis.install && analysis.install > 0)
  {
    report.push(generateReport("This page may try and install an extension!", SeverityEnum.SEVERE));
  }

  return report;
}

function addStatusReport(status)
{
  let report = [];
  if (status >= 300 && status < 400)
  {
    numRedirects++;
    document.getElementById("numRedirects").textContent = "Number of redirects is: " + numRedirects;
    report.push(generateReport("Status " + status + " redirect",
                               SeverityEnum.LOW));
  }
  else if (status >= 500)
  {
    report.push(generateReport("Status " + status + " failed to load",
                               SeverityEnum.MILD));
  }
  return report;
}

domainReports = {};

/*
  Create a report for the given URL and return it as a HTML element such as
  a div.
  Only runs once per URL so if a new report is needed then report[url] must be
  cleared.
*/
function createUrlReport(url)
{
  // Only do the same URL once
  if (report[url])
  {
    return null;
  }

  let urlReport = {
    domain: [],
    pathname: []
  };
  let parser = decomposeUrl(url);
  let domainReport = domainReports[parser.hostname];
  // If we haven't looked at this domain before then analyse it
  if (!domainReport)
  {
    domainReport = analyse_domain(parser.hostname);
    domainReports[parser.hostname] = domainReport;
    // Part of the domain but not in the hostname so do this separately
    if (parser.port)
    {
      domainReport.push(generateReport("Port is: " + parser.port, SeverityEnum.LOW));     // => "3000"
    }

    if (domainReport && domainReport.length > 0)
    {
      urlReport.domain = urlReport.domain.concat(domainReport);
      //console.log("domain!!!!");
      //console.log(urlReport);
    }
  }

  // Get the report for the pathname
  let pathnameReport = analyse_pathname(parser.pathname);
  // If the report contains anything then set this in the return object
  if (pathnameReport && pathnameReport.length > 0)
  {
    urlReport.pathname = urlReport.pathname.concat(pathnameReport);
    //console.log("pathname!!!!");
    //console.log(urlReport);
  }
  report[url] = urlReport;
  return urlReport;
}

let containers = {};

/*
  Return the div which corresponds to the report for the given URL.
  If one does not exist then it is created and returned, but NOT added
  to the document.
*/
function getDomainReportContainer(url)
{
  let parser = decomposeUrl(url);
  let domain = parser.hostname;

  // If it already exists then return the existing one
  let domainReportChildObj = containers[domain]; //document.getElementById(domain);
  if (domainReportChildObj)
  {
    return domainReportChildObj;
  }

  // If it does not already exist then build a new one
  domainReportChildObj = new DomainContainer();
  domainReportChildObj.buildDomainContainer(domain);

  return domainReportChildObj;
}
