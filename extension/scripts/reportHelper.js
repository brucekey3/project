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

function generateChild(parent, report)
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

class PathnameContainer()
{
  container = undefined;

  buildPathnameContainer(pathname)
  {
    this.container = document.createElement("section");
    this.container.setAttribute("class", "pathnameContainer");
    this.container.setAttribute("id", pathname);
    return container;
  }
}

class DomainContainer()
{
  // Defaults
  domain: undefined;
  domainContainer: undefined;

  buildDomainContainer(domain)
  {
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
    domainChild.setAttribute("id", domain + "_report");
    this.domainContainer.appendChild(domainChild)

    // Create the element which will contain the pathname reports
    let pathnameChild = document.createElement("span");
    pathnameChild.setAttribute("id", domain + "_pathnames");
    this.domainContainer.appendChild(pathnameChild)

    return this.domainContainer;
  }

  addDomainReport(report)
  {
    if (!report || report.length === 0)
    {
      return;
    }

    let reportContainer = document.getElementById(domain + "_report");
    reportContainer = generateChild(reportContainer, report);
  }

  addPathnameReport(pathname, pathnameReport)
  {
    if (!domainContainer)
    {
      console.log("Build container before adding pathnames");
      return;
    }

    let pathnameContainerObj = new PathnameContainer();
    pathnameContainerObj.buildPathnameContainer(pathname);
    pathnameContainerObj.addPathnameReport(pathnameReport);
    document.getElementById(domain + "_pathnames")
            .appendChild(pathnameContainerObj.pathnameContainer);
  }

}
