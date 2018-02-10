let specialCharacters = ['<','>','#','{','}','|','\\','^','~','[',']',/*'?','%'*/, '@'];
let suspiciousSeparators = ['-', '.']
// Match anything which contains a possible IP address
let ipRegex = /^(.*[^0-9]|)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)([^0-9].*|$)/;
let suspiciousSeparatorsThreshold = 5;

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
    var parser = document.createElement("a");
    parser.href = href;
    return parser;
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
    let occ = domain.split(sep).length;
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
    report.push(reportString);
  }

  // Check whether we are connecting to an IP address which has not been
  // resolved.
  if (isPureIPAddress(domain))
  {
    //console.log("Matches");
    report.push("Contains pure IP address");
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
    report.push("Port is: " + parser.port);     // => "3000"
  }
  //console.log(parser.host);     // => "example.com:3000"
  //console.log(parser.pathname); // => "/pathname/"
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
    report.push("Special characters: " + found.toString());
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
