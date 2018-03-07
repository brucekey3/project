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

function generateChildren(parent, report)
{
  for (let i in report)
  {
    let finding = document.createElement("span");
    finding.textContent = report[i].text;
    setSeverityAttributes(finding, report[i].severity);
    parent.appendChild(finding);
    parent.appendChild(document.createElement("br"));
  }
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
      elem.style.backgroundColor = "orange";
      break;
    case SeverityEnum.MILD:
      elem.style.backgroundColor = "orangeRed";
      break;
    case SeverityEnum.HIGH:
      elem.style.backgroundColor = "darkRed";
      break;
    case SeverityEnum.SEVERE:
      elem.style.backgroundColor = "red";
      break;
    default:
      elem.style.backgroundColor = "white";
      break;
  }

}

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


class PathnameContainer
{

  PathnameContainer()
  {
    this.pathnameContainer = undefined;
    this.pathname = undefined;
  }

  buildPathnameContainer(pathname)
  {
    this.pathname = pathname;
    this.pathnameContainer = document.createElement("div");
    this.pathnameContainer.setAttribute("class", "pathnameContainer");
    this.pathnameContainer.setAttribute("id", pathname);

    let descriptionWrapper = document.createElement("h3");
    descriptionWrapper.setAttribute("id", pathname + "description")
    //descriptionWrapper.setAttribute("class", "hidable");
    //descriptionWrapper.addEventListener("click", toggleHide.bind(null, pathname));
    let description = document.createTextNode("Report for pathname: " + pathname + ":");
    descriptionWrapper.appendChild(description);
    this.pathnameContainer.appendChild(descriptionWrapper);

    return this.pathnameContainer;
  }

  addPathnameReport(report)
  {
    this.pathnameContainer = generateChildren(this.pathnameContainer, report);
  }
}

class DomainContainer
{

  DomainContainer()
  {
    // Defaults
    this.domain = undefined;
    this.domainContainer = undefined;
  }

  buildDomainContainer(domain)
  {
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

    return this.domainContainer;
  }

  addDomainReport(domainReport)
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
    reportContainer = generateChildren(reportContainer, domainReport);
  }

  addPathnameReport(url, pathnameReport)
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
      this.addDomainReport(pathnameReport);
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

    let pathnameContainerObj = new PathnameContainer();
    pathnameContainerObj.buildPathnameContainer(pathname);
    pathnameContainerObj.addPathnameReport(pathnameReport);
    let pathnamesContainer = document.getElementById("pathnames" + this.domain);
    if (!pathnamesContainer)
    {
      console.log("Could not find pathnames container");
      console.log(pathname);
      console.log(this.domainContainer);
      return;
    }
    pathnamesContainer.appendChild(pathnameContainerObj.pathnameContainer);
    pathnamesContainer.appendChild(document.createElement("br"));

  }

}
