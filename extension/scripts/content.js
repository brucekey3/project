// content.js


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "logHeaders_clicked") {
      //var firstHref = $("a[href^='http']").eq(0).attr("href");
      console.log(request);
      let id = request.data;

      chrome.runtime.sendMessage({
        "message": "openWindow",
        "data": id
      });
    }
    else if (request.message === "onHeadersReceived") {
      // Request.data are the responseHeaders
      if (request.data[0].value >= 300 && request.data[0].value < 400) {
        console.log("Redirect");
        console.log(request.data[0]);
      }

    }
    else if (request.message === "pauseExec_clicked")
    {
      let id = request.data;
      chrome.runtime.sendMessage({
        "message": "pauseExecution",
        "data": id
      });
    }
    else if (request.message === "createReport_clicked")
    {
      let id = request.data;
      let urlReport = analyse_url();

      report = {
        "id": id,
        "urlReport": urlReport
      };

      chrome.runtime.sendMessage({
        "message": "createReportWindow",
        "data": report
      });
    }
});

function analyse_url()
{
  let report = "";
  let url = window.location.href;
  console.log("Matching with: " + str(url));
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (url.match(ipformat))
  {
    console.log("Matches");
    report += "Matches IP address";
  }
  else {
    console.log("Does not match");
    report += "No IP address";
  }
  return report;
}

function static_analysis(script)
{
  let varCount = (script.match(/var/gi) || []).length;
  let execCount = (script.match(/exec/gi) || []).length;
  let unescapeCount = (script.match(/unescape/gi) || []).length;
  let functionCount = (script.match(/function/gi) || []).length;
  return {
    "var": varCount,
    "exec": execCount,
    "unescape": unescapeCount,
    "function": functionCount
  };
}

console.log("Scripts:");
let scriptList = document.scripts;

for (let script of scriptList) {
  //console.log(script);
  let anal = static_analysis(script.text);
  console.log(anal);
}


/*
// How to send Post request + do something with result
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status != 420) {
       // Typical action to be performed when the document is ready:
       console.log("Response:");
       console.log(xhttp.responseText);
    }
};
xhttp.open("POST", "https://google.com");
xhttp.send();
*/
