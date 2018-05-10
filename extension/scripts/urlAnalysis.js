let specialCharacters = ['<','>','#','{','}','|','\\','^','~','[',']',/*'?','%'*/, '@'];
let suspiciousSeparators = ['-', '.']
// Match anything which contains a possible IP address
let ipRegex = /^(.*[^0-9]|)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)([^0-9].*|$)/;
let suspiciousSeparatorsThreshold = 5;
let suspiciousSlashesThreshold = 5;

// Uses the regex to test whether or not the string is an IP address
function isPureIPAddress(testString)
{
  return ipRegex.test(testString);
}

/* This breaks down a URL into the parts
parser.protocol => "http:"
parser.hostname => "example.com" also domain
parser.port     => "3000"
parser.host     => "example.com:3000"
parser.pathname => "/pathname/"
parser.search   => "?search=test"
parser.hash     => "#hash"
*/
function decomposeUrl(href) {
  /*
    var parser = document.createElement("a");
    parser.href = href;
    return parser;
  */
  let parser = undefined;
  // If it fails it is probably because it is missing the protocol
  try {
    parser = new URL(href);
  } catch (e) {
    parser = new URL("http://" + href);
  }

  return parser;
}

// Ensure there's no https:// or www. interfering
function stripDomain(domain)
{
  if (!domain)
  {
    return;
  }
  let stripped = domain;

  let stripFields = ["https://", "http://", "www."];

  for (field of stripFields)
  {
    let length = field.length;
    if (stripped.substring(0, length) === field)
    {
      stripped = stripped.substring(length);
    }
  }

  return stripped;
}


function analyse_domain(domain)
{
  let report = [];
  // Check for suspicious separators which can indicate phishing

  let foundSeparators = [];
  let suspiciousSeparatorsCount = 0;
  for (let i in suspiciousSeparators)
  {
    // The separator to search for
    let sep = suspiciousSeparators[i];
    // The number of occurances of said separator
    let occ = domain.split(sep).length - 1;
    if (occ > 0)
    {
      foundSeparators.push({separator: sep, count: occ});
      suspiciousSeparatorsCount += occ;
    }
  }

  if (suspiciousSeparatorsCount > suspiciousSeparatorsThreshold)
  {
    let reportString = "";
    reportString += "Domain contains " + suspiciousSeparatorsCount
                 + " suspicious separators." + '\n';
    for (let i in foundSeparators)
    {
      reportString += "Found " + foundSeparators[i].count + " '"
                   + foundSeparators[i].separator + "'"+ '\n';
    }
    reportString += "This may be phishing!";
    report.push(generateReport(reportString, SeverityEnum.MILD));
  }

  // Check whether we are connecting to an IP address which has not been
  // resolved.
  if (isPureIPAddress(domain))
  {
    //console.log("Matches");
    report.push(generateReport("Contains pure IP address", SeverityEnum.LOW));
  }

  return report;
}

function analyse_pathname(pathname)
{
  let report = [];
  //console.log("Matching with: " + url);

  //console.log("Decomposed:");
  //console.log(parser.protocol); // => "http:"
  //console.log(parser.hostname); // => "example.com" also domain
  //console.log("Host is: " + parser.host);     // => "example.com:3000"
  //console.log("Pathname: " + parser.pathname); // => "/pathname/"
  //console.log(parser.search);   // => "?search=test"
  //console.log(parser.hash);     // => "#hash"

  let found = [];
  for (let i in specialCharacters)
  {
    if (pathname.indexOf(specialCharacters[i]) !== -1)
    {
      //console.log("Special character: " + specialCharacters[i] + " found in URL " + url);
      found.push(specialCharacters[i]);
    }
  }

  if (found.length > 0)
  {
    report.push(generateReport("Special characters: " + found.toString(), SeverityEnum.LOW));
  }

  let numSlashes = (pathname.match(/\//g)||[]).length
  if (numSlashes > suspiciousSlashesThreshold)
  {
    report.push(generateReport("" + numSlashes + " /'s found, this could be malicious", SeverityEnum.LOW));
  }

  return report;
}

/*
  Analyses the url given by decomposing it and checking the parts for ports
  pure IP addresses and special characters
*/
function analyse_url(url)
{
  let report = [];
  //console.log("Matching with: " + url);

  let parser = decomposeUrl(url);
  //console.log("Decomposed:");
  //console.log(parser.protocol); // => "http:"
  //console.log(parser.hostname); // => "example.com" also domain

  let domainReport = analyse_domain(parser.hostname);
  report = report.concat(domainReport);

  if (parser.port)
  {
    report.push(generateReport("Port is: " + parser.port, SeverityEnum.LOW));     // => "3000"
  }
  //console.log("Host is: " + parser.host);     // => "example.com:3000"
  //console.log("Pathname: " + parser.pathname); // => "/pathname/"
  //console.log(parser.search);   // => "?search=test"
  //console.log(parser.hash);     // => "#hash"

  let found = [];
  for (let i in specialCharacters)
  {
    if (url.indexOf(specialCharacters[i]) !== -1)
    {
      //console.log("Special character: " + specialCharacters[i] + " found in URL " + url);
      found.push(specialCharacters[i]);
    }
  }
  if (found.length > 0)
  {
    report.push(generateReport("Special characters: " + found.toString(), SeverityEnum.LOW));
  }

  return report;
}

function parseURL(url) {
  var result = {};
  var match = url.match(
      /^([^:]+):\/\/([^\/:]*)(?::([\d]+))?(?:(\/[^#]*)(?:#(.*))?)?$/i);
  if (!match)
    return result;
  result.scheme = match[1].toLowerCase();
  result.host = match[2];
  result.port = match[3];
  result.path = match[4] || "/";
  result.fragment = match[5];
  return result;
}
