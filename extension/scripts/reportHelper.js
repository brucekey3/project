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
    this.pathnameContainer = document.createElement("section");
    this.pathnameContainer.setAttribute("class", "pathnameContainer");
    this.pathnameContainer.setAttribute("id", pathname);
    return this.pathnameContainer;
  }

  addPathnameReport(report)
  {
    let description = document.createTextNode("Report for " + this.pathname + ":");
    this.pathnameContainer.appendChild(description);
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
    this.domainContainer.textContent = "Report for domain: " + domain + ":";
    this.domainContainer.addEventListener("click", toggleHide.bind(null, domain));

    let wrapper = document.createElement("h1");
    let content = document.createTextNode( "Report for domain: " + domain + ":");
    wrapper.appendChild(content);
    this.domainContainer.appendChild(wrapper);

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
    if (!domainReport || domainReport.length === 0)
    {
      return;
    }
    else if (domainReport && domainReport.length == 0)
    {
      console.log("Empty domain report");
      return;
    }

    let urlReports = document.getElementById("urlReports");
    let documentDomainContainer = document.getElementById(this.domain);
    if (!documentDomainContainer)
    {
      urlReports.appendChild(this.domainContainer);
    }

    let reportContainer = document.getElementById("report_" + domain);
    reportContainer = generateChildren(reportContainer, report);
  }

  addPathnameReport(pathname, pathnameReport)
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

  }

}
