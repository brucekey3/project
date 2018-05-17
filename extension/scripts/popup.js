let reportingStatus = undefined;
let tabId = undefined;
let activeTab = undefined;

window.addEventListener('DOMContentLoaded', setUpEvents);
chrome.tabs.query({active: true, currentWindow: true},
  function(tabs)
  {
    activeTab = tabs[0];
    tabId = activeTab.id;
    setReportingStatus(tabId);

  }
);

function setUpEvents()
{
  document.getElementById("createReport").addEventListener("click", createReportClick);
  //document.getElementById("runTests").addEventListener("click", runTestsClick);
}

function runTestsClick(e)
{
  chrome.windows.create(
     {url: "tests/test.html",
      type: "popup",
      width: 800, height: 600});
}


// Will set status and sets new status
function setReportingStatus()
{
  chrome.storage.local.get(function(items) {
    if (Object.keys(items).length > 0 && items.data) {
        // The data array already exists, add to it the new server and nickname
        let found = false;
        for (obj of items.data)
        {
          if (obj.tabId == tabId)
          {
            reportingStatus = obj.reporting;
            found = true;
            break;
          }
        }

        if (!found)
        {
          reportingStatus = false;
        }
    }
    else
    {
        // The data array doesn't exist yet, create it
        items.data = [{tabId: tabId, reporting: true}];
        reportingStatus = true;
        chrome.storage.local.set(items, function() {
            console.log('Data successfully saved to the storage!');
        });
        console.log(reportingStatus);
    }

    if (reportingStatus)
    {
      document.getElementById("createReport").textContent = "Stop Tab Reporting";
    }
    else
    {
      document.getElementById("createReport").textContent = "Start Tab Reporting";
    }

    console.log(reportingStatus);
  });
}

function toggleReportingStatus()
{

  chrome.storage.local.get(function(items) {
    if (Object.keys(items).length > 0 && items.data) {
        // The data array already exists, add to it the new server and nickname
        let found = false;
        for (obj of items.data)
        {
          if (obj.tabId == tabId)
          {
            found = true;
            obj.reporting = !obj.reporting;
            reportingStatus = obj.reporting;
            break;
          }
        }

        if (!found)
        {
          items.data.push({tabId: tabId, reporting: true});
        }
    }
    else
    {
        // The data array doesn't exist yet, create it
        reportingStatus = true;
        items.data = [{tabId: tabId, reporting: reportingStatus}];
    }

    // Now save the updated items using set
    chrome.storage.local.set(items, function() {
        console.log('Data successfully saved to the storage!');
    });
    console.log(reportingStatus);

  });

}

function createReportClick(e)
{
  if (!reportingStatus)
  {
    document.getElementById("createReport").textContent = "Stop Tab Reporting";
    sendCreateReportMessage(activeTab);
  }
  else
  {
    document.getElementById("createReport").textContent = "Start Tab Reporting";
    sendStopReportMessage(activeTab);
  }
  toggleReportingStatus();

}

function sendCreateReportMessage(activeTab)
{
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  console.log("Sending createReportWindow message");
  chrome.runtime.sendMessage({
      "message": "createReportWindow",
      "data": {
        tabId: activeTab.id,
        url: activeTab.url
      }
  });
}

function sendStopReportMessage(activeTab)
{
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  console.log("Sending sendStopReportMessage message");
  chrome.runtime.sendMessage({
      "message": "stopReport",
      "data": {
        tabId: activeTab.id
      }
  });
}
