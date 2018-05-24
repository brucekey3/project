// Used when parsing certificate dates
const _MS_PER_DAY = 1000 * 60 * 60 * 24;
// Used for safeBrowsing
const API_KEY = 'AIzaSyBkdzT2k1HcVtyqMUr3v4Lkpswv8WfvyeQ';
let tabId = parseInt(window.location.search.substring(1));
// let extensionId = window.location.host;

let report = {};
let numRedirects = 0;
let numFourHundredErrors = 0;
let numRequests = 0;

let numConsoleErrors = 0;
let numConsoleWarnings = 0;

let redirectThreshold = 1;
let initialised = false;
let responses = {};

// Used for CPU usage monitoring
let lastUserUsage = [];
let lastKernelUsage = [];
let lastIdleUsage = [];
let lastTotalUsage = [];
let domainReports = {};
let containers = {};

function clear(e)
{
  report = {};
  numRedirects = 0;
  numFourHundredErrors = 0;
  numRequests = 0;
  numConsoleWarnings = 0;
  numConsoleErrors = 0;
  responses = {};
  numRedirects = 0;
  report = {};
  containers = {};
  domainReports = {};

  updateNumFourHundredErrorText();
  updateNumRedirectsText();
  updateNumRequestsText();
  updateNumConsoleErrors();
  updateNumConsoleWarnings();

  document.getElementById("passwordPresent").textContent = "There is a password form present";
  document.getElementById("passwordPresent").setAttribute("hidden", '');

  let node = document.getElementById("urlReports");
  while (node.hasChildNodes()) {
    node.removeChild(node.lastChild);
  }
}

function updateNumConsoleErrors()
{
  document.getElementById("numConsoleErrors").textContent = "Number of console errors is: " + numConsoleErrors;
}

function updateNumConsoleWarnings()
{
  document.getElementById("numConsoleWarnings").textContent = "Number of console warnings is: " + numConsoleWarnings;
}

function updateNumFourHundredErrorText()
{
  document.getElementById("numFourHundredErrors").textContent = "Number of 4XX errors is: " + numFourHundredErrors;
}

function updateNumRedirectsText()
{
  document.getElementById("numRedirects").textContent = "The number of redirects is: " + numRedirects;
}

function updateNumRequestsText()
{
  document.getElementById("numRequests").textContent = "Number of requests is: " + numRequests;
}


chrome.windows.onCreated.addListener(function(window) {
  console.log("New window created");
  console.dir(window);

  chrome.tabs.get(tabId, function(tab) {
    let container = getDomainReportContainer(tab.url);
    let newTabReport = [];
    let reportText = "";
    let severity = SeverityEnum.UNKNOWN;
    if (window.focused)
    {
      reportText = "New window created and is focused- if you did this then ignore this.";
      severy = SeverityEnum.MILD;
    }
    else
    {
      reportText = "New window created - if you did this then ignore this.";
      severity = SeverityEnum.LOW;
    }
    newTabReport.push(generateReport(reportText, severity));
    container.addPathnameReport(tab.url, newTabReport);
  });

});

/*
chrome.tabs.onCreated.addListener(function(newTab) {

  console.log("New tab created - is active: " + newTab.active);
  console.dir(newTab);

  chrome.tabs.get(tabId, function(tab) {
    let container = getDomainReportContainer(tab.url);
    let newTabReport = [];
    let reportText = "";
    let severity = SeverityEnum.UNKNOWN;
    if (newTab.active)
    {
      reportText = "New window created and is active - if you did this then ignore this.";
      severy = SeverityEnum.MILD;
    }
    else
    {
      reportText = "New window created - if you did this then ignore this.";
      severity = SeverityEnum.LOW;
    }
    newTabReport.push(generateReport(reportText, severity));
    container.addPathnameReport(tab.url, newTabReport);
  });

});
*/
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      // Only listen to messages for this tab

      if (sender.tab && sender.tab.id != tabId)
      {
        return;
      }

      if (request.message === "extensionInstallStarted")
      {
        let extensionReport = [];
        let details = request.data;
        // If we have no details or no URL we cannot create a report
        // The latter is since we need to know which domain container to add it
        // to
        if (details && details.iniatiatorUrl)
        {
          let reportString = "Page may be trying to install an extension!";
          extensionReport.push(generateReport(reportString, SeverityEnum.SEVERE));
          if (details.webstoreUrl)
          {
            reportString = "See extension at: " + details.webstoreUrl;
            extensionReport.push(generateReport(reportString, SeverityEnum.UNKNOWN));
          }

          let container = getDomainReportContainer(details.iniatiatorUrl);
          container.addPathnameReport(details.iniatiatorUrl, extensionReport, "Extension Install");
        }
      }
      else if (request.message === "notificationsRequested")
      {
        let notificationsReport = [];
        let details = request.data;
        // If we have no details or no URL we cannot create a report
        // The latter is since we need to know which domain container to add it
        // to
        if (details && details.iniatiatorUrl)
        {
          let reportString = "Page is requesting permission for notifications!";
          notificationsReport.push(generateReport(reportString, SeverityEnum.MILD));

          let container = getDomainReportContainer(details.iniatiatorUrl);
          container.addPathnameReport(details.iniatiatorUrl, notificationsReport, "Notifications Requested");
        }
      }
      else if (request.message === "formProcessed")
      {
        console.log("form processed");
        // note, work is now done in processRedirect

        let response = request.data.response;
        let analysis = static_analysis(response.body);
        console.dir(response);
        console.dir(analysis);
        let formReport = [];
        let container = getDomainReportContainer(response.url);

        if (!response.redirected && analysis.possibleRedirects > 0)
        {
          let reportText = "Possible redirect found from non-redirect response"
                         + " from form submission with fake credentials. Body "
                         + " contains location change"
                         + " - This may be phishing.";
          formReport.push(generateReport(reportText, SeverityEnum.LOW));
        }

        if (formReport.length > 0)
        {
          container.addDomainReport(formReport, "formResult");
        }
      }
      else if (request.message === "clickJackAnalysis")
      {
        console.log("analysed for clikjacking");
        console.dir(request);
      }
      else if (request.message === "windowOpen")
      {
        console.log("windowOpen");
        console.dir(request);
      }
      else if (request.message === "stopReport")
      {
        console.log("Stopping reporting");
        deinitialise();
        window.close();
      }
  }
);


function beginAnalysis()
{
  chrome.debugger.sendCommand({tabId:tabId}, "Network.clearBrowserCache", {}, null);

  //chrome.tabs.reload(tabId, {bypassCache: true}, function() {
    chrome.debugger.onEvent.addListener(onEvent);
    chrome.debugger.sendCommand({tabId:tabId}, "Performance.getMetrics", {}, processPerformanceMetrics);
    chrome.debugger.sendCommand({tabId:tabId}, "Profiler.setSamplingInterval", {interval: 100}, null);
    chrome.debugger.sendCommand({tabId:tabId}, "Profiler.startPreciseCoverage", {callCount: true, detailed: true}, function(){
        chrome.debugger.sendCommand({tabId:tabId}, "Profiler.start", {}, function() {
            window.setTimeout(stop, 10000);
        });
    //});

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

function initialise()
{
  chrome.debugger.sendCommand({tabId:tabId}, "Debugger.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Runtime.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Page.enable");

  chrome.debugger.sendCommand({tabId:tabId}, "Performance.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Security.enable");
  chrome.debugger.sendCommand({tabId:tabId}, "Log.enable");

  // Give the debugger time to set up
  window.setTimeout(beginAnalysis, 100);
  initialised = true;
}

function deinitialise()
{
  chrome.debugger.sendCommand({tabId:tabId}, "Debugger.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Network.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Runtime.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Page.disable");

  chrome.debugger.sendCommand({tabId:tabId}, "Performance.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.stopPreciseCoverage", {}, null);
  chrome.debugger.sendCommand({tabId:tabId}, "Profiler.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Security.disable");
  chrome.debugger.sendCommand({tabId:tabId}, "Log.disable");
  chrome.debugger.detach({tabId:tabId});

  chrome.runtime.sendMessage({message: "updateStorage", data: {tabId: tabId}});

}

window.addEventListener("load", function() {
  document.getElementById("clearBtn").addEventListener("click", clear);
  document.getElementById("reportsToggle").addEventListener("click", toggleHideEvent);
  //clear();
  if (!initialised)
  {
    initialise();
  }
  //console.log("Calling processDocument on load");
  processDocument(undefined);
});

window.addEventListener("unload", deinitialise);
window.addEventListener("beforeunload", deinitialise);


function monitorCpuUsage(lastUsage)
{
  chrome.system.cpu.getInfo(function (res){
    //console.log(res);
    let resourcesDiv = document.getElementById("resources");
    while (resourcesDiv.hasChildNodes()) {
      resourcesDiv.removeChild(resourcesDiv.lastChild);
    }


    let averageUserUsagePercentage = 0;

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

      averageUserUsagePercentage += userUsagePercentage;

      let processorInfo = document.createElement("section");
      processorInfo.style.border = "thin solid black";
      let title = document.createElement("span");
      title.textContent = "Processor " + i + ":";

      // Show the CPU usage for user process
      let user   = document.createElement("span");
      user.textContent = "User usage: " + userUsagePercentage + "%";

      /*
      let kernel = document.createElement("span");
      kernel.textContent = "Kernel usage: " + kernelUsagePercentage + "%";
      let idle   = document.createElement("span");
      idle.textContent = "Idle usage: " + idleUsagePercentage + "%";
      */

      if (userUsagePercentage > 70)
      {
        setSeverityAttributes(user, SeverityEnum.SEVERE);
        let warning = document.createElement("span");
        setSeverityAttributes(warning, SeverityEnum.SEVERE);
        warning.textContent = "Warning - high CPU usage on processor " + i + ". "
                            + "This site may be mining cryptocurrency.";
        processorInfo.appendChild(warning);
        processorInfo.appendChild(document.createElement("br"));
      }
      else if (userUsagePercentage > 50)
      {
        setSeverityAttributes(user, SeverityEnum.MILD);
      }
      else if (userUsagePercentage > 30)
      {
        setSeverityAttributes(user, SeverityEnum.LOW);
      }

      processorInfo.appendChild(title);
      processorInfo.appendChild(document.createElement("br"));
      processorInfo.appendChild(user);
      processorInfo.appendChild(document.createElement("br"));
      /*
      processorInfo.appendChild(kernel);
      processorInfo.appendChild(document.createElement("br"));
      processorInfo.appendChild(idle);
      processorInfo.appendChild(document.createElement("br"));
      */

      resourcesDiv.appendChild(processorInfo);
      lastUserUsage[i]   = userUsage;
      lastKernelUsage[i] = kernelUsage;
      lastIdleUsage[i]   = idleUsage;
      lastTotalUsage[i]  = totalUsage;
    }

    averageUserUsagePercentage /= res.numOfProcessors;

    let averageProcessorInfo = document.createElement("section");
    averageProcessorInfo.style.border = "thin solid black";

    // Show the Average CPU usage for user process over all processors
    let averageUser   = document.createElement("span");
    averageUser.textContent = "Average User usage: " + averageUserUsagePercentage + "%";
    averageProcessorInfo.appendChild(averageUser);
    averageProcessorInfo.appendChild(document.createElement("br"));

    if (averageUserUsagePercentage > 70)
    {
      setSeverityAttributes(averageUser, SeverityEnum.SEVERE);
    }
    else if (averageUserUsagePercentage > 50)
    {
      setSeverityAttributes(averageUser, SeverityEnum.MILD);
    }
    else if (averageUserUsagePercentage > 30)
    {
      setSeverityAttributes(averageUser, SeverityEnum.LOW);
    }

    if (averageUserUsagePercentage > 30)
    {
      let averageWarning = document.createElement("span");
      setSeverityAttributes(averageWarning, SeverityEnum.MILD);
      averageWarning.textContent = "Warning - high average CPU usage. "
                                 + "This site may be mining cryptocurrency.";
      averageProcessorInfo.appendChild(averageWarning);
      averageProcessorInfo.appendChild(document.createElement("br"));
    }

    resourcesDiv.appendChild(averageProcessorInfo);

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
  // alert("Download is starting!!");
  //console.dir(downloadItem);
  let downloadReport = [];
  let id = downloadItem.id;
  let beforeRedirects = downloadItem.url;
  let finalUrl = downloadItem.finalUrl;
  let mimeType = downloadItem.mime;
  let filename = downloadItem.filename;
  let danger = downloadItem.danger;

  downloadReport.push(generateReport("The url: " + beforeRedirects
                       + " initiated a download from: " + finalUrl,
                      SeverityEnum.HIGH));

  // TODO: Elaborate on this?
  downloadReport.push(generateReport("Mime type: " + mimeType, SeverityEnum.UNKNOWN));

  if (danger)
  {
    let dangerText = "";
    let severity = SeverityEnum.UNKNOWN;
    switch(danger)
    {
      case "file":
        dangerText = "The download's filename is suspicious.";
        severity = SeverityEnum.HIGH;
        break;
      case "url":
        dangerText = "The download's URL is known to be malicious.";
        severity = SeverityEnum.HIGH;
        break;
      case "content":
        dangerText = "The downloaded file is known to be malicious.";
        severity = SeverityEnum.HIGH;
        break;
      case "uncommon":
        dangerText = "The download's URL is not commonly downloaded and could be dangerous";
        severity = SeverityEnum.LOW;
        break;
      case "host":
        dangerText = "The download came from a host known to distribute malicious binaries and is likely dangerous.";
        severity = SeverityEnum.HIGH;
        break;
      case "unwanted":
        dangerText = "The download is potentially unwanted or unsafe. E.g. it could make changes to browser or computer settings.";
        severity = SeverityEnum.LOW;
        break;
      case "accepted":
        dangerText = "The user has accepted the dangerous download.";
        severity = SeverityEnum.HIGH;
        break;
      case "safe":
        dangerText = "The download presents no known danger to the user's computer.";
        severity = SeverityEnum.LOW;
        break;
      default:
        severity = SeverityEnum.UNKNOWN;
        // Do nothing
    }
    if (dangerText != "")
    {
      downloadReport.push(generateReport(dangerText, severity));
    }
  }

  if (filename && filename != "")
  {
    let severity = SeverityEnum.UNKNOWN;
    if (danger === "file")
    {
      severity = SeverityEnum.HIGH;
    }
    downloadReport.push(generateReport("Filename is: " + filename, severity));
  }


  let container = getDomainReportContainer(beforeRedirects);
  container.addPathnameReport(beforeRedirects, downloadReport);
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



chrome.webRequest.onBeforeRedirect.addListener(processRedirect, {urls: ["<all_urls>"]}, ["responseHeaders"]);
chrome.webRequest.onBeforeRequest.addListener(processRequest, {urls: ["<all_urls>"]}, ["requestBody"]);
chrome.webRequest.onResponseStarted.addListener(processResponse, {urls: ["<all_urls>"]}, ["responseHeaders"]);

function processRedirect(details) {
  let redirectTabId = details.tabId;

  // Ignore any redirects not related to this tab
  if (redirectTabId !== -1 && redirectTabId !== tabId)
  {
    return;
  }

  let requestId = details.requestId;
  let urlBeforeRedirect = details.url;
  let status = details.statusCode;
  let urlAfterRedirect = details.redirectUrl;

  let reportObj = getDomainReportContainer(urlBeforeRedirect);
  let severity = SeverityEnum.UNKNOWN;
  let report = [];

  // Ensure there's no https:// or www. interfering
  let beforeDomain = stripDomain(decomposeUrl(urlBeforeRedirect).hostname);
  let afterDomain = stripDomain(decomposeUrl(urlAfterRedirect).hostname);


  //console.log(beforeDomain);
  //console.log(afterDomain);

  if (beforeDomain != afterDomain)
  {
    severity = SeverityEnum.MILD;
  }
  else
  {
    severity = SeverityEnum.LOW;
  }

  let reportText = urlBeforeRedirect + " status " + status + " redirecting to: "
                 + urlAfterRedirect;
  // If the request was initated by the analyseForms script then handle this
  // separately
  //console.log(details.initiator);
  //console.log(document.location.origin);

  if (details.initiator === document.location.origin)
  {
    let domainReport = [];
    let reportString = "Redirected from a test form submission with false credentials -"
                     + " This may be phishing!";
    domainReport.push(generateReport(reportString, severity));
    domainReport.push(generateReport(reportText, severity));
    reportObj.addDomainReport(domainReport, "phishingWarning");
  }
  else
  {
    numRedirects += 1;
    updateNumRedirectsText();
    report.push(generateReport(reportText, severity));
    reportObj.addPathnameReport(urlBeforeRedirect, report);
  }


}

var expressionString = `
var isOverlap = function(rect1, rect2)
{
  var overlap = !(rect1.right <= rect2.left ||
          rect1.left >= rect2.right ||
          rect1.bottom <= rect2.top ||
          rect1.top >= rect2.bottom);

  if (overlap)
  {
    if (rect1.width + rect1.height === 0)
    {
      overlap = false;
    }
  }
  return overlap;
}

var isClickable = function(node)
{
  let clickable = false;

  if (node.tagName)
  {
  	let tagName = node.tagName.toLowerCase();

  	clickable |= (tagName === "button");
  	clickable |= (tagName === "a");
  }
  let clickEvents = getEventListeners(node).click;

  if (clickEvents)
  {
    clickable |= clickEvents.length > 0;
  }

  return clickable;
}


var gatherClickElements = function(curnode, gathered)
{
    if(isClickable(curnode))
    {
      gathered.push(curnode);
    }

    curnode.childNodes.forEach(function(child) {
        gatherClickElements(child, gathered);
    });
};

var isVisible = function(elem)
{
  let styles = window.getComputedStyle(elem);
  let opacity = styles.getPropertyValue("opacity");
  let current_color = styles.getPropertyValue("background-color").replace(/\\s/g, '');
  let match = /rgba?\\((\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(,\\s*\\d+[\\.\\d+]*)*\\)/g.exec(current_color);

  /*
  console.dir(current_color);
  console.dir(match);
  console.log(opacity);
  console.log(styles.display);
  */

  if (match && match.length > 0 && match[0] === "rgba(0,0,0,0)")
  {
    return false;
  }
  if (!opacity)
  {
    return false;
  }

  if (styles.display === 'none')
  {
    return false;
  }

  return true;
}

var getClickListeners = function(elem)
{
  let res = [];
  let events = getEventListeners(elem);
  if (events && events.click)
  {
    for (event of events.click)
    {
      res.push(event.listener.toString());
    }
  }
  return res;
}

  var clickElems = [];
  gatherClickElements(document.documentElement, clickElems);

  var overlapResults = {};
  for (let i = 0; i < clickElems.length; i++)
  {
    let elem = clickElems[i];
    for (let j = i; j < clickElems.length; j++)
    {
      let elem2 = clickElems[j];
      if (elem != elem2)
      {
        let rect1 = elem.getBoundingClientRect();
        let rect2 = elem2.getBoundingClientRect();

        if (rect1 && rect2)
        {
          let overlaps = isOverlap(rect1, rect2);
          if (overlaps)
          {
            let vis1 = isVisible(elem);
            let vis2 = isVisible(elem2);
            if ((vis1 && !vis2) || (!vis1 && vis2))
            {
              getClickListeners(elem);
              getClickListeners(elem2);

              let json = JSON.stringify({html: elem.outerHTML, clickListeners: getClickListeners(elem)});
              let json2= JSON.stringify({html: elem2.outerHTML, clickListeners: getClickListeners(elem2)});
              if (!overlapResults[json])
              {
                overlapResults[json] = [];
              }

              overlapResults[json].push(json2);
            }
          }
        }
      }
    }
  }

  overlapResults;
`;

function processDocument(params)
{
  chrome.debugger.sendCommand({tabId:tabId}, "DOM.getDocument", {depth: -1, pierce: true}, function(root){
    if (chrome.runtime.lastError)
    {
      console.log(chrome.runtime.lastError.message);
      return;
    }
    //console.log(root.root);
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.querySelectorAll", {nodeId: root.root.nodeId, selector: "input"}, processInputSelector);

  });

  console.log("Analysing forms");
  chrome.tabs.executeScript(tabId, {
        file: 'scripts/analyseForms.js',
        allFrames: true,
  });

  console.log("Looking for clickjacking");
  /*
  chrome.tabs.executeScript(tabId, {
        file: 'scripts/clickJackAnalysis.js',
        allFrames: true,
  });
  */


    chrome.debugger.sendCommand({tabId:tabId}, "Runtime.evaluate",
                                {
                                  expression: expressionString,
                                  includeCommandLineAPI: true,
                                  returnByValue: true
                                },
      function (result, exceptionDetails){
        let overlapResults = result.result.value;
        console.dir(overlapResults);
        console.dir(exceptionDetails);

        let clickJackReport = [];

        for (var result in overlapResults)
        {
          if (overlapResults.hasOwnProperty(result))
          {
            let res = "";
            let obj = JSON.parse(result);
            let resultHtml = obj.html;

            let elem1 = document.createElement("div");
            elem1.innerHTML = resultHtml;
            console.dir(elem1.firstElementChild);
            console.dir(obj.clickListeners);
            clickJackReport = clickJackReport.concat(analyseListeners(obj.clickListeners));
            console.log("This Element overlaps with " + overlapResults[result].length + " elements: ");

            let reportString = "";
            reportString += elem1.firstElementChild.tagName + " overlaps with "
                         + overlapResults[result].length + " elements";

            for (overlap of overlapResults[result])
            {
              let obj2 = JSON.parse(overlap);
              let overlapResultsHtml = obj2.html;
              let elem2 = document.createElement("div");
              elem2.innerHTML = overlapResultsHtml;
              //console.dir(elem2.firstElementChild);
              //console.dir(obj2.clickListeners);
              clickJackReport = clickJackReport.concat(analyseListeners(obj2.clickListeners));
              reportString += ", " + elem2.firstElementChild.tagName;
            }

            clickJackReport.push(generateReport(reportString, SeverityEnum.LOW));
          }
        }

        chrome.tabs.get(tabId, function(tab) {
          let container = getDomainReportContainer(tab.url);
          container.addPathnameReport(tab.url, clickJackReport, "clickjack");
        })


      }
    );

}

function analyseListeners(listeners)
{
  let listenerReport = [];
  for (listener of listeners)
  {
    let analysis = static_analysis(listener);
    console.dir(analysis);
    listenerReport = listenerReport.concat(processAnalysis(analysis));
  }
  return listenerReport;
}

function processAnalysis(analysis)
{
  let analysisReport = [];
  if (analysis.windowOpen > 0)
  {
    analysisReport.push(generateReport("May open a new window", SeverityEnum.LOW));
  }
  return analysisReport;
}

function processLogEntryAdded(params)
{
  if (!params)
  {
    return;
  }

  let entry = params.entry;

  //console.dir(entry);
  if (entry.level === "error")
  {
    console.log("Updating error count:" + numConsoleErrors);
    numConsoleErrors += 1;
    updateNumConsoleErrors();
  }
  else if (entry.level === "warning");
  {
    numConsoleWarnings += 1;
    updateNumConsoleWarnings();
  }
}

function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
  {
    return;
  }

  if (message === "Network.responseReceived")
  {
    responses[params.requestId] = params;
    processInitialResponse(params);
  }
  else if (message === "Network.loadingFinished")
  {
    processResponseBody(params);
  }
  else if (message === "DOM.documentUpdated")
  {
    //console.log("calling processDocument on document update");
    processDocument(params);
  }
  else if (message === "Security.securityStateChanged")
  {
    processSecurityStateChanged(params);
  }
  // Note: this may be deprecated
  else if (message === "Security.certificateError")
  {
    processCertificateError(params);
  }
  else if (message === "Performance.metrics")
  {
    processPerformanceMetrics(params);
  }
  else if (message === "Profiler.consoleProfileFinished")
  {
    processProfilerResults(params);
  }
  else if (message === "Page.windowOpen")
  {
    // #ToDo
    processWindowOpen(params);
  }
  else if (message === "Log.entryAdded")
  {
    processLogEntryAdded(params)
  }
  else if (message === "Debugger.scriptParsed")
  {
    if(params.url !== "" && params.url.indexOf("extension") === -1)
    {
      console.log("script parsed");
      console.dir(params);
    }
  }

}

function processWindowOpen(params)
{
  let url = params.url;
  let windowName = params.windowName;
  let windowFeatures = params.windowFeatures; // Array
  let triggeredByUserGesture = params.userGesture;

  console.log("Window opened");
  console.dir(params);

  let container = getDomainReportContainer(url);
  let newTabReport = [];
  let reportText = "";
  let severity = SeverityEnum.UNKNOWN;
  if (triggeredByUserGesture)
  {
    reportText = "Window opened to this domain - caused by user gesture. \n";
    reportText += "If this was intentional ignore this.";
    severity = SeverityEnum.LOW;
  }
  else
  {
    reportText = "Window opened to this domain - NOT caused by user gesture.";
    severity = SeverityEnum.HIGH;
  }
  newTabReport.push(generateReport(reportText, severity));
  container.addPathnameReport(url, newTabReport, "windowOpen");
}

function processInitialResponse(params)
{
  //console.log("For " + params.response.url);


  /*

  // Need to figure out how to decode this

  chrome.debugger.sendCommand({tabId:tabId}, "Network.getCertificate", {origin: params.response.url}, function(tableNames) {
    if (!tableNames)
    {
      return;
    }
    console.dir(tableNames);
  });
  */



  if (params.response.securityDetails)
  {
    securityReport = [];
    //console.dir(params.response.securityDetails);

    let startTimestamp = params.response.securityDetails.validFrom;
    let endTimestamp = params.response.securityDetails.validTo;
    let currentdate = new Date();
    //currentdate.getDate()
    //currentdate.getMonth()
    //currentdate.getFullYear() + " @ "

    let startDate = getDateOfTimestamp(startTimestamp);
    let endDate = getDateOfTimestamp(endTimestamp);

    // Discard the time and time-zone information.
    let startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let currUtc = Date.UTC(currentdate.getFullYear(), currentdate.getMonth(), currentdate.getDate());
    let endUtc = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Time until certificate expiry
    timeRemaining = Math.floor((endUtc - currUtc) / _MS_PER_DAY);
    // Time the certificate was issued for
    issuedFor = Math.floor((endUtc - startUtc) / _MS_PER_DAY);
    // How long ago the certificate was issued
    issuedAgo = Math.floor((currUtc - startUtc) / _MS_PER_DAY);

    let startDateSeverity = SeverityEnum.UNKNOWN;
    let endDateSeverity = SeverityEnum.UNKNOWN;
    let durationSeverity = SeverityEnum.UNKNOWN;

    if (timeRemaining <= 0)
    {
      endDateSeverity = SeverityEnum.SEVERE;
    }
    else
    {
      if (issuedFor <= 86.5)
      {
        // benign
      }
      else
      {
        if (timeRemaining <= 123.5 )
        {
           if (issuedAgo <= 748)
           {
             // MALICIOUS
             startDateSeverity = SeverityEnum.MILD;
           }
           else
           {
             // Benign
           }
        }
        else
        {
          if (issuedFor <= 915.0)
          {
            if (issuedFor <= 429.0)
            {
              if (issuedFor <= 272.5)
              {
                // benign
              }
              else // issued for > 272.5
              {
                if (timeRemaining <= 283.5)
                {
                  if (issuedFor <= 365.5)
                  {
                    durationSeverity = SeverityEnum.MILD;
                  }
                  else // issued for > 365.5
                  {
                    // benign
                  }
                }
                else // Time til expires > 283.5
                {
                  // Malicious
                  endDateSeverity = SeverityEnum.MILD;
                }
              }
            }
            else // Issued for > 429
            {
              // Benign
            }
          }
          else // issued for > 915
          {
              // MALICIOUS
              durationSeverity = SeverityEnum.MILD;
          }
        }
      }
    }

    securityReport.push(generateReport("Issued: " + startDate, startDateSeverity));
    securityReport.push(generateReport("Runs out: " + endDate, endDateSeverity));
    securityReport.push(generateReport("Issued for " + issuedFor, durationSeverity));
    securityReport.push(generateReport("Time remaining: " + timeRemaining, endDateSeverity));
    securityReport.push(generateReport("Time since issued: " + issuedAgo, startDateSeverity));

    let reportObj = getDomainReportContainer(params.response.url);
    if (!reportObj)
    {
      console.log("Failed to get report container for: " + params.response.url);
      console.dir(decomposeUrl(params.response.url));
      return;
    }
    reportObj.addDomainReport(securityReport, "CertificateDetails");
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

  let report = [].push(generateReport("Certificate error: " + errorType,
                                      SeverityEnum.SEVERE));
  reportObj.addDomainReport(report);
  console.log("CERTIFICATE ERROR");
  alert("certificate error");
}

function createSecurityExplanations(explanations)
{
  if (explanations.length == 0)
  {
    console.log("No explanations found");
  }

  let section = document.createElement("span");

  for (explain of explanations)
  {
    let explanationSection = document.createElement("span");
    explanationSection.textContent = '\n';
    explanationSection.textContent += "Security state is: " + explain.securityState + '\n';
    explanationSection.textContent += "Factor is: " + explain.title + '\n';
    explanationSection.textContent += "Summary: " + explain.summary + '\n';
    explanationSection.textContent += "Full explanation: " + explain.description + '\n';

    let mixedContentTypeSection = document.createElement("span");
    switch (explain.mixedContentType)
    {
      case "none":
        mixedContentTypeSection.textContent = "No mixed content";
        break;
      case "blockable":
        mixedContentTypeSection.textContent = "Mixed content is blockable";
        break;
      case "optionally-blockable":
        mixedContentTypeSection.textContent = "Mixed content is optionally-blockable";
        break;
      default:
        console.log("mixedContentType is " + explain.mixedContentType);
        break;
    }
    section.appendChild(explanationSection);
    section.appendChild(mixedContentTypeSection);

  }

  return section;
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

    switch (securityState)
    {
      case "neutral":
        setSeverityAttributes(state, SeverityEnum.MILD);
        state.appendChild(createSecurityExplanations(explanations));
        break;
      case "insecure":
        setSeverityAttributes(state, SeverityEnum.HIGH);
        state.appendChild(createSecurityExplanations(explanations));
        break;
      case "secure":
        state.textContent = "Security state is: " + securityState;
        break;
      case "info":
        state.appendChild(createSecurityExplanations(explanations));
        break;
      default:
        state.textContent = "Security state is: " + securityState;
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

  if (insecureContentStatus)
  {
    let insecureContentStatusElem = document.createElement("div");
    insecureContentStatusElem.textContent = "Ran Mixed Content: " + insecureContentStatus.ranMixedContent + '\n';
    insecureContentStatusElem.textContent += "Displayed Mixed Content: " + insecureContentStatus.displayedMixedContent + '\n';
    insecureContentStatusElem.textContent += "Contained Mixed Form: " + insecureContentStatus.containedMixedForm + '\n';
    insecureContentStatusElem.textContent += "Ran Content With Certificate Errors (e.g. scripts): " + insecureContentStatus.ranContentWithCertErrors + '\n';
    insecureContentStatusElem.textContent += "Displayed Content With Certificate Errors (e.g. images): " + insecureContentStatus.displayedContentWithCertErrors + '\n';
    insecureContentStatusElem.textContent += "State of page if insecure content is run: " + insecureContentStatus.ranInsecureContentStyle + '\n';
    insecureContentStatusElem.textContent += "State of page if insecure content is displayed: " + insecureContentStatus.displayedInsecureContentStyle + '\n';
    div.appendChild(insecureContentStatusElem);
  }
  //console.log("Security state changed");
  //console.log(params);
}

function toggleHideEvent(e)
{
  toggleHide("urlReports");
  let btn = document.getElementById("reportsToggle");
  if (btn.textContent === "Hide Reports")
  {
    btn.textContent = "Unhide Reports";
  }
  else
  {
    btn.textContent = "Hide Reports";
  }
}

function toggleHide(id)
{
  console.log("Hiding " + id);
  let elem = document.getElementById(id);
  $(elem).toggleClass("down");

  if (elem.hasAttribute("hidden"))
  {
    elem.removeAttribute("hidden");
  }
  else {
    elem.setAttribute("hidden", '');
  }


}


/*
{
  "matches": [
    {
      "threatType": "SOCIAL_ENGINEERING",
      "platformType": "ANY_PLATFORM",
      "threat": {
        "url": "https://you-fanspage-recovery.tk/"
      },
      "cacheDuration": "300s",
      "threatEntryType": "URL"
    }
  ]
}
ex 2
{
  "matches": [{
    "threatType":      "MALWARE",
    "platformType":    "WINDOWS",
    "threatEntryType": "URL",
    "threat":          {"url": "http://www.urltocheck1.org/"},
    "threatEntryMetadata": {
      "entries": [{
        "key": "malware_threat_type",
        "value": "landing"
     }]
    },
    "cacheDuration": "300.000s"
  }, {
    "threatType":      "MALWARE",
    "platformType":    "WINDOWS",
    "threatEntryType": "URL",
    "threat":          {"url": "http://www.urltocheck2.org/"},
    "threatEntryMetadata": {
      "entries": [{
        "key":   "malware_threat_type",
        "value": "landing"
     }]
    },
    "cacheDuration": "300.000s"
  }]
}



*/
function addSafeBrowsingReport(matches)
{
  console.dir(matches)
  for (match of matches)
  {
    let safeReport = [];
    switch (match.threatType)
    {
      case "MALWARE":
        let safeReportText = "Site is malware targeting: " + match.platformType;
        // TODO: make this change severity based on platforms?
        safeReport.push(generateReport(safeReportText, SeverityEnum.SEVERE));

        for (let entry of matches.threatEntryMetadata.entries)
        {
          safeReportText = entry.key + ": " + entry.value;
          safeReport.push(generateReport(safeReportText, SeverityEnum.SEVERE));
        }
        break;
      case "SOCIAL_ENGINEERING":
        let socialEngineeringText = "Site is confirmed social engineering";
        safeReport.push(generateReport(socialEngineeringText, SeverityEnum.SEVERE));
        break;
      case "UNWANTED_SOFTWARE":
        break;
      case "POTENTIALLY_HARMFUL_APPLICATION":
        break;
      case "THREAT_TYPE_UNSPECIFIED":
        break;
      default:
        let defaultText = "Unknown reason that site is harmful";
        safeReport.push(generateReport(defaultText, SeverityEnum.SEVERE));
        break;
    }

    let url = match.threat.url;
    let containerObject = getDomainReportContainer(match.threat.url);
    if (containerObject)
    {
      containerObject.addDomainReport(safeReport, "SafeBrowsing");
    }
    else
    {
      console.log("SafeBrowsing couldn't add report - no container returned");
    }

  }
}

function safeCheckCallback(url, matches)
{
  //console.log("Checked: " + url);
  //console.log("Got: " + result);
  if (matches !== undefined)
  {
    // Malicious3
    addSafeBrowsingReport(matches);
  }
}



function processInputSelector(nodeIdResults)
{
  if (chrome.runtime.lastError)
  {
    console.log(chrome.runtime.lastError.message);
    return;
  }
  else  if (!nodeIdResults)
  {
    console.log("processInputSelector called with undefined object");
    return;
  }

  let nodeIds = nodeIdResults.nodeIds;

  for (let index in nodeIds)
  {
    let nodeId = nodeIds[index];
    //console.dir(nodeId);
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.describeNode", {"nodeId": nodeId}, function(object) {
      if (chrome.runtime.lastError)
      {
        console.log(chrome.runtime.lastError.message);
        return;
      }
      let shouldBeFilled = false;
      let node = object.node;

      if (node && node.attributes && node.attributes.length > 0)
      {
        // Stored as name1,value1,name2,value2, etc
        for (let i = 0; i < node.attributes.length - 1; i +=2)
        {
          if (node.attributes[i] === "type" && node.attributes[i+1] === "password")
          {
            document.getElementById("passwordPresent").removeAttribute("hidden");
          }

          if (node.attributes[i] === "type"
          && (node.attributes[i+1] !== "hidden" && node.attributes[i+1] !== "submit")
          )
          {
            shouldBeFilled = true;
          }
        }

        /*
        if (shouldBeFilled)
        {
          console.dir(nodeId);
          chrome.debugger.sendCommand({tabId:tabId},
            "DOM.setAttributeValue",
            {"nodeId": nodeId, name: "value", value: "Bite me"});
        }
        */
      }
    });

    document.getElementById("passwordPresent").setAttribute("hidden", '');
    chrome.debugger.sendCommand({tabId:tabId}, "DOM.resolveNode", {"nodeId": nodeId}, function(object)
    {
      if (chrome.runtime.lastError)
      {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      let item = object.object;
      if (item.description.indexOf("pass") !== -1 || item.type === "password")
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

  let parser = decomposeUrl(url);

  // How to send Post request + do something with result    let dangerText = "";
  let severity = SeverityEnum.UNKNOWN;
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
         // Typical action to be performed when the document is ready:

        let obj = JSON.parse(xhttp.responseText);
        //console.log(xhttp.responseText);
        safeCheckCallback(url, obj.matches);
      }
  };
  xhttp.open("POST", 'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=' + API_KEY);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  let requestBody = {
   "client": {
     "clientId":      "HoneyBrowser",
     "clientVersion": "0.0.1"
   },
   "threatInfo": {
     "threatTypes":      ["MALWARE", "SOCIAL_ENGINEERING"],
     "platformTypes":    ["ANY_PLATFORM"],
     "threatEntryTypes": ["URL"],
     "threatEntries": [
       {"url": parser.hostname}
     ]
   }
  };
  xhttp.send(JSON.stringify(requestBody));
}


function processRequest(details)
{
  let requestTabId = details.tabId;

  // Ignore any requests not related to this tab
  if (requestTabId !== -1 && requestTabId !== tabId)
  {
    return;
  }

  numRequests += 1;
  updateNumRequestsText();

  let url = details.url;
  let parser = decomposeUrl(url);
  // If it's a data: or chrome-extension: url then don't send safebrowsing check
  if (parser.hostname !== "" && parser.protocol != "chrome-extension:")
  {
    // This involves an async request so can't return a report
    sendSafeBrowsingCheck(url);
  }

  let urlReport = createUrlReport(url);

  // If we have already done this url then null is returned and we should
  // not bother performing any analysis on it
  if (!urlReport)
  {
    return;
  }

  let container = getDomainReportContainer(url);

  if (urlReport.domain && urlReport.domain.length > 0)
  {
    container.addDomainReport(urlReport.domain, "URL Report");
  }

  if (urlReport.pathname && urlReport.pathname.length > 0)
  {
    container.addPathnameReport(url, urlReport.pathname, "URL Report");
  }
}

function processResponse(details)
{
  if (!details)
  {
    console.log("processResponse called with no params");
    return;
  }
  let responseTabId = details.tabId;

  // Ignore any responses not related to this tab
  if (responseTabId !== -1 && responseTabId !== tabId)
  {
    return;
  }


  let url = details.url;

  let container = getDomainReportContainer(url);

  // Status report will be per unique URL i.e. combination of domain and path
  let statusReport = createStatusReport(details);
  if (statusReport && statusReport.length > 0)
  {
    container.addPathnameReport(url, statusReport, "Status Report");
  }

}

function processResponseBody(params)
{
  if (!params)
  {
    return;
  }

  let details = responses[params.requestId];
  let url = details.response.url;

  let container = getDomainReportContainer(url);
  let resourceType = details.type;
  /*
    "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
    "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket",
     or "other"
  */
  if (resourceType === "Script"
   || resourceType === "Document")
  {
      chrome.debugger.sendCommand({tabId: tabId}, "Network.getResponseBody", {"requestId": details.requestId}, function(result) {
        if (chrome.runtime.lastError)
        {
          console.log(chrome.runtime.lastError.message);
          return;
        }
        else if (!result)
        {
          console.log("Empty response body");
          return;
        }
        let base64Encoded = result.base64Encoded;
        let script = result.body;
        // use btoa()?
        if (base64Encoded)
        {
          console.log("SCRIPT IS base64Encoded");
          // Decode
          script = atob(script);
        }

        let scriptReport = createScriptReport(script);
        if (scriptReport.length > 0)
        {
          reportToBeDisplayed = true;
          container.addPathnameReport(url, scriptReport);
        }

      });
    }
    delete responses[details.requestId];
}

function createScriptReport(script)
{
  let report = []
  let analysis = static_analysis(script);
  //console.dir(analysis);
  if (analysis.install && analysis.install > 0)
  {
    report.push(generateReport("This page may try and install an extension!", SeverityEnum.SEVERE));
  }
  // TODO: add report here for location change

  return report;
}

// This needs to take in the details object so that we can add relevant
// information such as url to redirect to in the case of 3xx codes
function createStatusReport(details)
{
  let status = details.statusCode;
  let report = [];
  if (status >= 300 && status < 400)
  {
    console.log("REDIRECT THO");
    numRedirects += 1;
    updateNumRedirectsText();
    report.push(generateReport("Status " + status + " redirect",
                               SeverityEnum.LOW));
  }
  else if (status >= 400 && status < 500)
  {
    numFourHundredErrors += 1;
    updateNumFourHundredErrorText();
    report.push(generateReport("Status " + status + " server error",
                               SeverityEnum.MILD));
  }
  else if (status >= 500)
  {
    report.push(generateReport("Status " + status + " server error",
                               SeverityEnum.MILD));
  }
  return report;
}



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
    return report[url];
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



/*
  Return the element which corresponds to the report for the given URL.
  If one does not exist then it is created and returned, but NOT added
  to the document.
*/
function getDomainReportContainer(url)
{
  let parser = decomposeUrl(url);
  let domain = parser.hostname;

  // Ignore things from ourself and things which aren't URLs
  if (domain === document.location.hostname || parser.protocol === "data:")
  {
    return;
  }

  // If it already exists then return the existing one
  let domainReportChildObj = containers[domain];

  if (!domainReportChildObj)
  {
    // If it does not already exist then build a new one
    domainReportChildObj = new DomainContainer();
    let elem = domainReportChildObj.buildDomainContainer(domain);
    if (!elem)
    {
      console.log("failed to create domain report container for: " + url);
      return;
    }
    //document.getElementById("urlReports").appendChild(elem);
    containers[domain] = domainReportChildObj;
  }
  return domainReportChildObj;

}
