let SeverityEnum = Object.freeze({UNKOWN: -1, LOW:0, MILD:1, HIGH:2, SEVERE:3});

function generateReport(text, severity)
{
  if (severity !== SeverityEnum.LOW
  &&  severity !== SeverityEnum.MILD
  &&  severity !== SeverityEnum.HIGH
  &&  severity !== SeverityEnum.SEVERE)
  {
    return {text: text, severity: SeverityEnum.UNKNOWN};
  }
  return {text: text, severity: severity};
}

function generateChildren(parent, report, label)
{

  let container = document.createElement("div");
  if (label)
  {
    container.innerHTML = "<h4><u>" + label + "</u></h4></br>";
    let id = parent.id + label;
    let elem = document.getElementById(id);
    if (elem)
    {
      parent.removeChild(elem);
    }

    container.setAttribute("id", id);
  }

  for (let i in report)
  {
    let finding = document.createElement("span");
    finding.textContent = report[i].text;
    setSeverityAttributes(finding, report[i].severity);
    container.appendChild(finding);
    container.appendChild(document.createElement("br"));
  }
  parent.appendChild(container);
  return parent;
}

function setSeverityAttributes(elem, severity)
{
  if (!elem)
  {
    return;
  }

  switch (severity)
  {
    case SeverityEnum.LOW:
      elem.style.backgroundColor = "yellow";
      break;
    case SeverityEnum.MILD:
      elem.style.backgroundColor = "orange";
      break;
    case SeverityEnum.HIGH:
      elem.style.backgroundColor = "orangeRed";
      break;
    case SeverityEnum.SEVERE:
      elem.style.backgroundColor = "#ff1717";
      break;
    default:
      elem.style.backgroundColor = "white";
      break;
  }

}

function static_analysis(script)
{
  let analysis = {};
  analysis.varCount = (script.match(/var/gi) || []).length;
  analysis.execCount = (script.match(/exec/gi) || []).length;
  analysis.unescapeCount = (script.match(/unescape/gi) || []).length;
  analysis.functionCount = (script.match(/function/gi) || []).length;
  analysis.install = (script.match(/chrome\.webstore\.install/gi)|| []).length;
  analysis.possibleRedirects = (script.match(/location\.href[\s]*=/gi)|| []).length;
  analysis.possibleRedirects += (script.match(/location\.replace[\s]*=/gi)|| []).length;
  analysis.possibleRedirects += (script.match(/location\.assign[\s]*=/gi)|| []).length;
  analysis.possibleRedirects += (script.match(/location[\s]*=/gi)|| []).length;
  analysis.possibleRedirects += (script.match(/location[\s]*=/gi)|| []).length;
  analysis.windowOpen = (script.match(/window.[\s]open/gi)|| []).length;

  return analysis;
}

function getDateOfTimestamp(timestamp)
{
  // Create a new JavaScript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds.
  var date = new Date(timestamp*1000);
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = "0" + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = "0" + date.getSeconds();

  // Will display time in 10:30:23 format
  var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
  return date;
}

class PathnameContainer
{

  PathnameContainer()
  {
    this.pathnameContainer = undefined;
    this.pathname = undefined;
  }

  buildPathnameContainer(domain, pathname)
  {
    this.pathname = pathname;
    this.pathnameContainer = document.createElement("div");
    this.pathnameContainer.setAttribute("class", "pathnameContainer");
    this.pathnameContainer.setAttribute("id", domain + pathname);

    let descriptionWrapper = document.createElement("h3");
    descriptionWrapper.setAttribute("id", pathname + "description")
    //descriptionWrapper.setAttribute("class", "hidable");
    //descriptionWrapper.addEventListener("click", toggleHide.bind(null, pathname));
    let description = document.createTextNode("Report for pathname: " + pathname + ":");
    descriptionWrapper.appendChild(description);
    this.pathnameContainer.appendChild(descriptionWrapper);

    return this.pathnameContainer;
  }

  addPathnameReport(report, label)
  {

    this.pathnameContainer = generateChildren(this.pathnameContainer, report, label);
  }
}

class DomainContainer
{


  DomainContainer()
  {
    // Defaults
    this.domain = undefined;
    this.domainContainer = undefined;
    this.pathnameContainers = undefined;
  }

  buildDomainContainer(domain)
  {
    if (domain === "")
    {
      return undefined;
    }
    // Set the domain of this class
    this.domain = domain;

    // Create the container for the domain report
    this.domainContainer = document.createElement("section");
    this.domainContainer.setAttribute("class", "domainContainer");
    this.domainContainer.setAttribute("id", domain);

    // Create the element to hold the description
    let descriptionWrapper = document.createElement("h1");
    descriptionWrapper.setAttribute("id", domain + "description")
    //descriptionWrapper.setAttribute("class", "hidable");
    //descriptionWrapper.addEventListener("click", toggleHide.bind(null, domain));
    let description = document.createTextNode( "Report for domain: " + domain + ":");
    descriptionWrapper.appendChild(description);
    this.domainContainer.appendChild(descriptionWrapper);

    // Create the element which will contain the pathname reports
    let domainChild = document.createElement("span");
    domainChild.setAttribute("id", "report_" + domain);
    this.domainContainer.appendChild(domainChild)

    // Create the element which will contain the pathname reports
    let pathnameChild = document.createElement("span");
    pathnameChild.setAttribute("id", "pathnames" + this.domain);
    this.domainContainer.appendChild(pathnameChild)

    this.pathnameContainers = {};

    return this.domainContainer;
  }

  addDomainReport(domainReport, label)
  {
    if (!domainReport)
    {
      return;
    }
    else if (domainReport && domainReport.length == 0)
    {
      console.log("Empty domain report");
      return;
    }
    //console.log("domainReport");
    //console.log(domainReport);
    let urlReports = document.getElementById("urlReports");
    let documentDomainContainer = document.getElementById(this.domain);
    if (!documentDomainContainer)
    {
      urlReports.appendChild(this.domainContainer);
    }

    let reportContainer = document.getElementById("report_" + this.domain);

    reportContainer = generateChildren(reportContainer, domainReport, label);
  }

  addPathnameReport(url, pathnameReport, label)
  {

    if (!this.domainContainer || !this.domain)
    {
      console.log("Build container before adding pathnames");
      return;
    }
    else if (pathnameReport && pathnameReport.length == 0)
    {
      console.log("Empty pathname report");
      return;
    }

    let parser = decomposeUrl(url);
    let pathname = parser.pathname;
    if (!pathname)
    {
      console.log("Could not extract pathname from: " + url);
      return;
    }
    else if (parser.hostname != this.domain)
    {
      console.log(parser.hostname + " does not match domain " + this.domain
                  + " incorrect container found.");
      return;
    }

    // If there is no pathname add it as a domain report instead
    if (pathname === "" || pathname === "/")
    {
      this.addDomainReport(pathnameReport, label);
      return;
    }

    //console.log("pathnameReport");
    //console.log(pathnameReport);

    let urlReports = document.getElementById("urlReports");
    let documentDomainContainer = document.getElementById(this.domain);
    if (!documentDomainContainer)
    {
      urlReports.appendChild(this.domainContainer);
    }

    let pathnameContainerObj = this.pathnameContainers[pathname];
    if (!pathnameContainerObj)
    {
      pathnameContainerObj = new PathnameContainer();
      pathnameContainerObj.buildPathnameContainer(this.domain, pathname);
      this.pathnameContainers[pathname] = pathnameContainerObj;
    }

    pathnameContainerObj.addPathnameReport(pathnameReport, label);
    let pathnamesContainer = document.getElementById("pathnames" + this.domain);
    if (!pathnamesContainer)
    {
      console.log("Could not find pathnames container");
      console.log(pathname);
      console.log(this.domainContainer);
      return;
    }
    pathnamesContainer.appendChild(pathnameContainerObj.pathnameContainer);

    if (pathnamesContainer.lastChild.tagName !== "br")
    {
      //pathnamesContainer.appendChild(document.createElement("br"));
    }

  }

}
