# project

## Known Issues
System resource usage is not per tab so visiting multiple tabs at the same time means that the system resources will not be specific to the tab the user wishes to investigate.

## Functionality

### CPU usage monitoring
Monitors cumulative user, kernel and idle CPU usage time for each processor, works out the difference between measurements and translates this into a percentage. Greater than 70% user usage is considered worth a warning since the site may be
mining cryptocurrency on the user's computer.

### Request Processing

* Checks the domain of the URLs being requested to see whether they contain an IP address which has not been resolved to a hostname. This is deemed suspicious.

* On every request which is sent, sends a request to Google's SafeBrowsing API to assess whether or not the domain is known to be malicious. If it is then known information is displayed.

* The URL is also checked to see if it contains a port. This is deemed suspicious.

* The domain is checked for suspicious separators ('-' and '.'), if the count is greater than a certain number then the domain is flagged as a potential phishing URL.

* The URL is checked for any special characters (such as '<', '>', '@' for example) and if any are found then it is deemed suspicious.

### Response Processing
* If the connection is secured over HTTPS then the certificate is examined and displayed to the user. The date that the certificate was issued and the date that it expires are examined in order to determine whether it is still valid and novel results are used to do a preliminary check whether or not the site is likely suspicious. This is not to be trusted too much, however, since many certificates from legitimate sites and malicious sites can seem similar.

* The response body is checked to see whether or not it contains a script, if it does, the script is statically analysed for anything suspicious. This is covered in the "Static Analysis" section

* The status of the response is examined. If the status is a 3XX code then it is flagged as a redirect. If it is a 500 code then this is also flagged.

* When a redirect is received, this is flagged to the user with the status code and the URLs that are being directed from and to.

### Static Analysis
Looks for:
*  "chrome.webstore.install" which indicates an extension will be installed.
* "document.location" functions which indicates a possible redirection
* Presence of "exec" and "unescape" (Although this is not currently shown in the results yet #ToDo)
