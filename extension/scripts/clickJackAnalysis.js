
/*
var all = document.getElementsByTagName("*");

for (elem of all)
{
  console.log(elem.onclick);
  if(getEventListeners(elem).click)
  {
    clickElems.push(elem);
  }
}
*/


var isHidden = function(el) {
  try
  {
    var style = window.getComputedStyle(el);
    return (style.display === 'none')
  }
  catch (e)
  {
    return false;
  }
}


var isOverlap = function(rect1, rect2)
{
  var overlap = !(rect1.right < rect2.left ||
          rect1.left > rect2.right ||
          rect1.bottom < rect2.top ||
          rect1.top > rect2.bottom);

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
  let current_color = styles.getPropertyValue("background-color").replace(/\s/g, '');;
  let match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(current_color);

  if (match.length > 0 && match[0] === "rgba(0,0,0,0)")
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

var getOverlapResults = function()
{
  var clickElems = [];
  gatherClickElements(document.documentElement, clickElems);

  /*
  getEventListeners(clickElems[5]).click
  document.getElementById(clickElems[5].id).removeAttribute('onclick')
  */

  var overlapResults = [];
  for (elem of clickElems)
  {
    for (elem2 of clickElems)
    {
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
              overlapResults.push([elem, elem2]);
            }
          }
        }
      }
    }
  	//console.dir(elem.getBoundingClientRect())
  }
  return overlapResults;
}

var overlapResults = getOverlapResults();

chrome.runtime.sendMessage({
  message: "clickJackAnalysis",
  data: {
    overlaps: overlapResults
  }
});
