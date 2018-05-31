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

var isVisible = function(styles)
{
  let opacity = styles["opacity"];
  let current_color = (styles["background-color"] || "").replace(/\s/g, '');
  let match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(current_color);

  if (match && match.length > 0 && match[0] === "rgba(0,0,0,0)")
  {
    return false;
  }
  if (!opacity)
  {
    return false;
  }

  if (styles["display"] === 'none')
  {
    return false;
  }

  return true;
}

var getClickListeners = function(elem)
{
  let res = [];
  let events = elem.eventListeners;
  if (events)
  {
    for (event of events)
    {
      if (event.type === "click")
      {
        res.push(event);
      }
    }
  }
  return res;
}
/*
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
  */
