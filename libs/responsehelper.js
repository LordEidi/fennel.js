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
    setDAVHeaders: setDAVHeaders,
    setAllowHeader: setAllowHeader
};

function setStandardHeaders(request)
{
    var res = request.getRes();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Server", "Fennel");
    //res.setHeader("Cache-Control", "private, max-age=0");
    //res.setHeader("X-Content-Type-Options", "nosniff");
    //res.setHeader("X-Frame-Options", "SAMEORIGIN");
    //res.setHeader("X-XSS-Protection", "1; mode=block");
}

function setDAVHeaders(request)
{
    var res = request.getRes();
    res.setHeader("DAV", "1, 3, extended-mkcol, calendar-access, calendar-schedule, calendar-proxy, calendarserver-sharing, calendarserver-subscribed, addressbook, access-control, calendarserver-principal-property-search");
}

function setAllowHeader(request)
{
    var res = request.getRes();
    res.setHeader("Allow", "OPTIONS, PROPFIND, HEAD, GET, REPORT, PROPPATCH, PUT, DELETE, POST, COPY, MOVE");
}
