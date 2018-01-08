function click(e) {
  chrome.tabs.executeScript(null,
      {code:"document.body.style.backgroundColor='" + e.target.id + "'"});

}


document.addEventListener('DOMContentLoaded', function () {
  //var buttons = document.querySelectorAll('button');
  document.getElementById("logHeaders").addEventListener("click", logHeadersClick);
  document.getElementById("pauseExecution").addEventListener("click", pauseExecClick);
});


function logHeadersClick(e) {
  console.log("Log Headers");

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    let id = activeTab.id;
    console.log(id);
    chrome.tabs.sendMessage(id, {
        "message": "logHeaders_clicked",
        "data": id
    });
  });

  //window.close();
}

function pauseExecClick(e) {
  console.log("Pause Execution");

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    let id = activeTab.id;
    console.log(id);
    chrome.tabs.sendMessage(id, {
        "message": "pauseExec_clicked",
        "data": id
    });
  });

  //window.close();
}
