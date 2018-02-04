// Match anything which contains a possible IP address
let ipRegex = /^.*\d+\.\d+\.\d+\.\d+.*$/;

let ipRegex2 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

let try3 = /^(.*[^0-9]|)(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)([^0-9].*|$)/;
// Uses the regex to test whether or not the string is an IP address
function isPureIPAddress(testString)
{
  return try3.test(testString);
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
