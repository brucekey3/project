// content.js

/*
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.message === "createReport_clicked")
    {
      let id = request.data;
      chrome.runtime.sendMessage({
        "message": "createReportWindow",
        "data": id
      });
      console.log("createReportWindow message sent");
    }
});
*/
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

/*
console.log("Scripts:");
let scriptList = document.scripts;

for (let script of scriptList) {
  //console.log(script);
  let anal = static_analysis(script.text);
  console.log(anal);
}
*/
