# project

## Known Issues
System resource usage is not per tab so visiting multiple tabs at the same time means that the system resources will not be specific to the tab the user wishes to investigate.

## Functionality

Monitors cumulative user, kernel and idle CPU usage time, works out the difference between measurements and translates this into a percentage. Greater than 70% user usage is considered worth a warning.

Checks the domain of the URLs being requested to see whether they contain an IP address which has not been resolved to a hostname.
