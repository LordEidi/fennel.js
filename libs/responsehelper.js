/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

// Exporting.
module.exports = {
    setStandardHeaders: setStandardHeaders,
    setDAVHeaders: setDAVHeaders
};

function setStandardHeaders(res)
{
    res.setHeader("Content-Type", "application/xml; charset=UTF-8");
    res.setHeader("Server", "Fennel");
    res.setHeader("Cache-Control", "private, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
}

function setDAVHeaders(res)
{
    res.setHeader("DAV", "1, 3, extended-mkcol, calendar-access, calendar-schedule, calendar-proxy");
    res.setHeader("Allow", "OPTIONS, PROPFIND, HEAD, GET, REPORT, PROPPATCH, PUT, DELETE, POST");
}