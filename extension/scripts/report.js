// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabId = parseInt(window.location.search.substring(1));

window.addEventListener("load", function() {
  display_report();
});

window.addEventListener("unload", function() {

});

var report = {};

function display_report()
{
  chrome.runtime.getBackgroundPage(function(bgWindow) {
        report = bgWindow.getReport(tabId);
        var requestDiv = document.createElement("div");
        requestDiv.className = "request";
        requestDiv.appendChild(urlLine);
        console.log(report);
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
