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
