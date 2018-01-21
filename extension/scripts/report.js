// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let tabId = parseInt(window.location.search.substring(1));
let report = {};
let numRedirects = 0;
let redirectThreshold = 1;

window.addEventListener("load", function() {
  chrome.debugger.sendCommand({tabId:tabId}, "Network.enable");
  chrome.debugger.onEvent.addListener(onEvent);
});

window.addEventListener("unload", function() {
  chrome.debugger.detach({tabId:tabId});
});

function onEvent(debuggeeId, message, params) {
  if (tabId != debuggeeId.tabId)
    return;
  console.log(message);
  if (message == "Network.requestWillBeSent") {
    processRequest(params);
  } else if (message == "Network.responseReceived") {
    processResponse(params);
  }
}

function processRequest(params)
{

}

function processResponse(params)
{
  let url = params.response.url;
  let status = params.response.status;
  let urlReport = analyse_url(url);
  report[url] = urlReport;
  if (urlReport && urlReport.length > 0)
  {
    var urlReportLine = document.createElement("div");
    urlReportLine.textContent = params.response.url + " Report: " + urlReport;
    document.getElementById("container").appendChild(urlReportLine);
  }

  if (status >= 300 && status < 400)
  {
    numRedirects++;
    document.getElementById("numRedirects").textContent = "Number of redirects is: " + numRedirects;
  }
}


function analyse_url(url)
{
  let report = "";
  console.log("Matching with: " + url);
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (url.match(ipformat))
  {
    console.log("Matches");
    report += "Matches IP address";
  }
  else {
    console.log("Does not match");
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
