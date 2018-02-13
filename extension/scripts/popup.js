window.addEventListener('DOMContentLoaded', setUpEvents);

function setUpEvents()
{
  document.getElementById("createReport").addEventListener("click", createReportClick);
  document.getElementById("runTests").addEventListener("click", runTestsClick);
}

function runTestsClick(e)
{
  chrome.windows.create(
     {url: "tests/test.html",
      type: "popup",
      width: 800, height: 600});
}

function createReportClick(e)
{
  chrome.tabs.query({active: true, currentWindow: true}, sendCreateReportMessage);
}

function sendCreateReportMessage(tabs)
{
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }
  
  let activeTab = tabs[0];
  console.log("Sending createReportWindow message");
  chrome.runtime.sendMessage({
      "message": "createReportWindow",
      "data": activeTab.id
  });
}
