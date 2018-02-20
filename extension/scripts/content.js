// content.js

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Please");
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.request == "static_analysis")
    {
      let scriptList = document.scripts;
      let analysisArray = [];
      for (let script of scriptList)
      {
        analysisArray.push(static_analysis(script.text));
      }
      sendResponse({analysis: analysisArray});
    }
});

function static_analysis(script)
{
  let varCount = (script.match(/var/gi) || []).length;
  let execCount = (script.match(/exec/gi) || []).length;
  let unescapeCount = (script.match(/unescape/gi) || []).length;
  let functionCount = (script.match(/function/gi) || []).length;
  let install = (script.match(/chrome\.webstore\.install/gi)|| []).length;
  return {
    var: varCount,
    exec: execCount,
    unescape: unescapeCount,
    function: functionCount,
    install: install
  };
}
