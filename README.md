# Honey Browser

## Known Issues
System resource usage is not per tab so visiting multiple tabs at the same time means that the system resources will not be specific to the tab the user wishes to investigate.

## Functionality

### CPU usage monitoring
* Monitors cumulative user, kernel and idle CPU usage time for each processor, works out the difference between measurements and translates this into a percentage. Greater than 70% user usage is considered worth a warning since the site may be
mining cryptocurrency on the user's computer.

* User usage percentages are displayed to the user for each core.

* Average user usage over all processors is also displayed

### Request Processing

* Checks the domain of the URLs being requested to see whether they contain an IP address which has not been resolved to a hostname. This is deemed suspicious.

* On every request which is sent, sends a request to Google's SafeBrowsing API to assess whether or not the domain is known to be malicious. If it is then known information is displayed.

* The URL is also checked to see if it contains a port. This is deemed suspicious.

* The domain is checked for suspicious separators ('-' and '.'), if the count is greater than a certain number (currently 5) then the domain is flagged as a potential phishing URL.

* The URL is checked for any special characters (such as '<', '>', '@' for example) and if any are found then it is deemed suspicious.

* URL path is checked for number of '/'. If greater than 5 a warning is issued to the user.

* The number of requests is kept track of and displayed

### Response Processing
* If the connection is secured over HTTPS then the certificate is examined and displayed to the user. The date that the certificate was issued and the date that it expires are examined in order to determine whether it is still valid and novel results are used to do a preliminary check whether or not the site is likely suspicious. This is not to be trusted too much, however, since many certificates from legitimate sites and malicious sites can seem similar.

* The response body is checked to see whether or not it contains a script, if it does, the script is statically analysed for anything suspicious. This is covered in the "Static Analysis" section

* The status of the response is examined. If the status is a 3XX code then it is flagged as a redirect. If it is a 500 code then this is also flagged.

* The number of 4XX codes and redirects is kept track of and displayed

* When a redirect is received, this is flagged to the user with the status code and the URLs that are being directed from and to. Severity is increased if the redirect changes domain. The number of redirects is also kept track of since a high number can be suspicious.

### Static Analysis

#### Script Analysis

* "chrome.webstore.install" which indicates an extension will be installed.
* "document.location" functions which indicates a possible redirection
* "window.open" function which indicates a new window will be created
* Presence of "exec" considered suspicious

#### Document Analysis (on every time it is refreshed):
* Finds all inputs on the page and checks for any of type "password" and if any are found a warning is issued that the page may ask for password input.
* Also checks description of input nodes for "pass" to find password inputs.
* Document elements are checked for listeners to mouse movement which may indicate clickjacking
* All clickable elements are checked for overlaps which could also indicate clickjacking.

### Dynamic Analysis

* When a download starts a warning is displayed and and known details are displayed with it. The URL which initiated the download is displayed and any suspicious details are shown (which are automatically detected by the Chrome browser).

* The "security state" of the page is monitored and displayed to the user and is updated on any change. This includes information on whether the page is loaded over a secure conenction, whether there is mixed content and any explanations about why the site may not be secure.

* Keeps track of and displays the number of console messaged flagged as warnings or errors of the page.

* When a new tab or window are opened, a report is added for the originating domain which informs the user a new tab/window has been opened

#### Function hooks

* "Chrome.webstore.install" is hooked and when called a warning will be displayed that the page is trying to install an extension and relevant information is displayed such as where the install originated from and what the URL is of the install.

* "Notifications.requestPermission" is hooked and when called a warning will be displayed that the page is trying to request permission to send notifications to the user.

* "window.open" is hooked and when called will display the the page is opening a new window


### Anti-Phishing
* Any forms on the page which are not search forms are filled in with dummy values and submitted. If there is a resulting redirect then a warning is displayed in the report window since this is a sign that the page has perceived the action as successful when it should not have been. Benign pages normally respond with 200 OK and display errors on the page but will sometimes redirect to another page with a captcha, for example, so this method is not foolproof. At the moment the form filling is limited to 'select' tags and inputs labelled as email and password. Any unknown inputs are labelled with simpler non-specific text.
An observed method some phishing pages use is to return 200 OK and then have the page itself redirect to a different place which cannot currently be detected by this method.
