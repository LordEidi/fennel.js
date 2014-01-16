/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var xml = require("libxmljs");
var rh = require("../libs/responsehelper");
var xh = require("../libs/xmlhelper");
var log = require('../libs/log').log;

// Exporting.
module.exports = {
    propfind: propfind,
    proppatch: proppatch,
    report: report,
    options: options
};

function propfind(body, req, res)
{
    log.debug("principal.propfind called");

    rh.setStandardHeaders(res);
    rh.setDAVHeaders(res);

    res.writeHead(207);

    res.write(xh.getXMLHead());

    if(isPropfindChecksumVersion(body))
    {
        replyChecksumVersion(body, req, res);
    }

    if(isPropfindSynctoken(body))
    {
        replyPropfindSynctoken(body, req, res);
    }

    if(isPropfindSupportedReportSet(body))
    {
        replyPropfindSupportedReportSet(body, req, res);
    }
/*
    if(req.url.indexOf("calendars") > -1)
    {
        console.log("return calendar");

        res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\">");
        res.write("<d:response>");
        res.write("		<d:href>" + req.url + "</d:href>");
        res.write("		<d:propstat>");
        res.write("			<d:prop>");
        res.write("				<d:current-user-privilege-set>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:write/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:write-acl/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:write-properties/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:write-content/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:bind/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:unbind/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:unlock/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:read/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:read-acl/>");
        res.write("					</d:privilege>");
        res.write("					<d:privilege xmlns:d=\"DAV:\">");
        res.write("						<d:read-current-user-privilege-set/>");
        res.write("					</d:privilege>");
        res.write("				</d:current-user-privilege-set>");
        res.write("				<d:owner>");
        res.write("					<d:href>/p/name/</d:href>");
        res.write("				</d:owner>");
        res.write("				<d:resourcetype>");
        res.write("					<d:collection/>");
        res.write("				</d:resourcetype>");
        res.write("				<d:supported-report-set>");
        res.write("					<d:supported-report>");
        res.write("						<d:report>");
        res.write("							<d:sync-collection/>");
        res.write("						</d:report>");
        res.write("					</d:supported-report>");
        res.write("					<d:supported-report>");
        res.write("						<d:report>");
        res.write("							<d:expand-property/>");
        res.write("						</d:report>");
        res.write("					</d:supported-report>");
        res.write("					<d:supported-report>");
        res.write("						<d:report>");
        res.write("							<d:principal-property-search/>");
        res.write("						</d:report>");
        res.write("					</d:supported-report>");
        res.write("					<d:supported-report>");
        res.write("						<d:report>");
        res.write("							<d:principal-search-property-set/>");
        res.write("						</d:report>");
        res.write("					</d:supported-report>");
        res.write("				</d:supported-report-set>");
        res.write("			</d:prop>");
        res.write("			<d:status>HTTP/1.1 200 OK</d:status>");
        res.write("		</d:propstat>");
        res.write("	</d:response>");

        createCalendar(res, "108e8519-0957-4afb-a954-eb78a14d3382", "Tasks");
        createCalendar(res, "4fa1e8c7-3b9b-4511-a774-69c98ae3eb3c", "Calendar");

        res.write("</d:multistatus>");
        res.end("");

    }
    else
    {
    }
*/
    //log.debug(res.toString());
}

function options(body, req, res)
{
    log.debug("principal.options called");

    rh.setStandardHeaders(res);
    rh.setDAVHeaders(res);

    res.writeHead(200);
}

function report(body, req, res)
{
    console.log("Call REPORT");

    rh.setStandardHeaders(res);

    res.writeHead(200);

    res.write(xh.getXMLHead());

    res.write("<d:principal-search-property-set xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("  <d:principal-search-property>\r\n");
    res.write("    <d:prop>\r\n");
    res.write("      <d:displayname/>\r\n");
    res.write("    </d:prop>\r\n");
    res.write("    <d:description xml:lang=\"en\">Display name</d:description>\r\n");
    res.write("  </d:principal-search-property>\r\n");
    res.write("  <d:principal-search-property>\r\n");
    res.write("    <d:prop>\r\n");
    res.write("      <s:email-address/>\r\n");
    res.write("    </d:prop>\r\n");
    res.write("    <d:description xml:lang=\"en\">Email address</d:description>\r\n");
    res.write("  </d:principal-search-property>\r\n");
    res.write("</d:principal-search-property-set>\r\n");

    res.end("");

}

function proppatch(req, res)
{
    console.log("Call PROPPATCH");

    rh.setStandardHeaders(res);

    res.writeHead(200);


    res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("	<d:response>\r\n");
    res.write("		<d:href>" + req.url + "</d:href>\r\n");
    res.write("		<d:propstat>\r\n");
    res.write("			<d:prop>\r\n");
    res.write("				<cal:default-alarm-vevent-date/>\r\n");
    res.write("			</d:prop>\r\n");
    res.write("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
    res.write("		</d:propstat>\r\n");
    res.write("	</d:response>\r\n");
    res.write("</d:multistatus>\r\n");


    res.end("");
}

function isPropfindChecksumVersion(body)
{
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/C:checksum-versions', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyChecksumVersion(body, req, res)
{
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>/calendars/a3298271331/</d:href></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindSynctoken(body)
{
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:sync-token', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindSynctoken(body, req, res)
{

    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response>");
    res.write("<d:href>/calendars/a3298271331/108e8519-0957-4afb-a954-eb78a14d3382/</d:href>");
    res.write("<d:propstat><d:prop>");
    res.write("<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>");
    res.write("<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag></d:prop>");
    res.write("<d:status>HTTP/1.1 200 OK</d:status>");
    res.write("</d:propstat></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindSupportedReportSet(body)
{
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:supported-report-set', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindSupportedReportSet(body, req, res)
{
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("  <d:response>\r\n");
    res.write("    <d:href>" + req.url + "</d:href>\r\n");
    res.write("    <d:propstat>\r\n");
    res.write("      <d:prop>\r\n");
    res.write("        <d:principal-URL>\r\n");
    res.write("        		<d:href>/p/name/</d:href>\r\n");
    res.write("        </d:principal-URL>\r\n");
    res.write("        <d:displayname>lord test</d:displayname>\r\n");
    res.write("        <d:principal-collection-set>\r\n");
    res.write("        	<d:href>/p/uid/</d:href>\r\n");
    res.write("        </d:principal-collection-set>\r\n");
    res.write("        <d:current-user-principal>\r\n");
    res.write("        	<d:href>/p/name/</d:href>\r\n");
    res.write("        </d:current-user-principal>\r\n");
    res.write("        <cal:calendar-home-set>\r\n");
    res.write("        	<d:href>/p/name/calendars/</d:href>\r\n");
    res.write("        </cal:calendar-home-set>\r\n");
    res.write("        <cal:calendar-user-address-set>\r\n");
    res.write("        	<d:href>mailto:lord test at swordlord.com</d:href>\r\n");
    res.write("        	<d:href>/p/name/</d:href>\r\n");
    res.write("        </cal:calendar-user-address-set>\r\n");
    res.write("        <cs:notification-URL>\r\n");
    res.write("        	<d:href>/p/name/calendars/notifications/</d:href>\r\n");
    res.write("        </cs:notification-URL>\r\n");
    res.write("        <d:supported-report-set>\r\n");
    res.write("        	<d:supported-report>\r\n");
    res.write("        		<d:report>\r\n");
    res.write("        			<d:expand-property/>\r\n");
    res.write("        		</d:report>\r\n");
    res.write("        	</d:supported-report>\r\n");
    res.write("        	<d:supported-report>\r\n");
    res.write("        		<d:report>\r\n");
    res.write("        			<d:principal-property-search/>\r\n");
    res.write("        		</d:report>\r\n");
    res.write("        	</d:supported-report>\r\n");
    res.write("        	<d:supported-report>\r\n");
    res.write("        		<d:report>\r\n");
    res.write("        			<d:principal-search-property-set/>\r\n");
    res.write("        		</d:report>\r\n");
    res.write("        	</d:supported-report>\r\n");
    res.write("        </d:supported-report-set>\r\n");
    res.write("      </d:prop>\r\n");
    res.write("		<d:status>HTTP/1.1 200 OK</d:status>\r\n");
    res.write("    </d:propstat>\r\n");
    res.write("  </d:response>\r\n");
    res.write("</d:multistatus>\r\n");
}

function isPropfindContenttype(body)
{
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:getcontenttype', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindContenttype(body, req, res)
{
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>/calendars/a3298271331/108e8519-0957-4afb-a954-eb78a14d3382/</d:href></d:response>");
    res.write("</d:multistatus>");
}


function createCalendar(res, uuid, name)
{
    res.write("	<d:response>");
    res.write("		<d:href>/p/name/calendars/" + uuid + "/</d:href>");
    res.write("		<d:propstat>");
    res.write("			<d:prop>");
    res.write("				<d:current-user-privilege-set>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:read-free-busy xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:write/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:write-acl/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:write-properties/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:write-content/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:bind/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:unbind/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:unlock/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:read/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:read-acl/>");
    res.write("					</d:privilege>");
    res.write("					<d:privilege xmlns:d=\"DAV:\">");
    res.write("						<d:read-current-user-privilege-set/>");
    res.write("					</d:privilege>");
    res.write("				</d:current-user-privilege-set>");
    res.write("				<d:owner>");
    res.write("					<d:href>/p/name/</d:href>");
    res.write("				</d:owner>");
    res.write("				<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>");
    res.write("				<cs:allowed-sharing-modes>");
    res.write("					<cs:can-be-shared/>");
    res.write("					<cs:can-be-published/>");
    res.write("				</cs:allowed-sharing-modes>");
    res.write("				<x6:calendar-color xmlns:x6=\"http://apple.com/ns/ical/\">#F64F00FF</x6:calendar-color>");
    res.write("				<x6:calendar-order xmlns:x6=\"http://apple.com/ns/ical/\">1</x6:calendar-order>");
    res.write("				<cal:calendar-timezone>BEGIN:VCALENDAR&#13;");
    res.write("VERSION:2.0&#13;");
    res.write("PRODID:-//Apple Inc.//Mac OS X 10.9.1//EN&#13;");
    res.write("CALSCALE:GREGORIAN&#13;");
    res.write("BEGIN:VTIMEZONE&#13;");
    res.write("TZID:Europe/Zurich&#13;");
    res.write("BEGIN:DAYLIGHT&#13;");
    res.write("TZOFFSETFROM:+0100&#13;");
    res.write("RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU&#13;");
    res.write("DTSTART:19810329T020000&#13;");
    res.write("TZNAME:GMT+2&#13;");
    res.write("TZOFFSETTO:+0200&#13;");
    res.write("END:DAYLIGHT&#13;");
    res.write("BEGIN:STANDARD&#13;");
    res.write("TZOFFSETFROM:+0200&#13;");
    res.write("RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU&#13;");
    res.write("DTSTART:19961027T030000&#13;");
    res.write("TZNAME:GMT+1&#13;");
    res.write("TZOFFSETTO:+0100&#13;");
    res.write("END:STANDARD&#13;");
    res.write("END:VTIMEZONE&#13;");
    res.write("END:VCALENDAR&#13;");
    res.write("</cal:calendar-timezone>");
    res.write("				<d:displayname>" + name + "</d:displayname>");
    res.write("				<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag>");
    res.write("				<cs:pre-publish-url>");
    res.write("					<d:href>https://localhost/" + uuid + ".ics</d:href>");
    res.write("				</cs:pre-publish-url>");
    res.write("				<cal:schedule-calendar-transp>");
    res.write("					<cal:opaque/>");
    res.write("				</cal:schedule-calendar-transp>");
    res.write("				<cal:supported-calendar-component-set>");
    res.write("					<cal:comp name=\"VTODO\"/>");
    res.write("				</cal:supported-calendar-component-set>");
    res.write("				<d:resourcetype>");
    res.write("					<d:collection/>");
    res.write("					<cal:calendar/>");
    res.write("				</d:resourcetype>");
    res.write("				<d:supported-report-set>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<cal:calendar-multiget/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<cal:calendar-query/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<cal:free-busy-query/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<d:expand-property/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<d:principal-property-search/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<d:principal-search-property-set/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("					<d:supported-report>");
    res.write("						<d:report>");
    res.write("							<d:sync-collection/>");
    res.write("						</d:report>");
    res.write("					</d:supported-report>");
    res.write("				</d:supported-report-set>");
    res.write("			</d:prop>");
    res.write("			<d:status>HTTP/1.1 200 OK</d:status>");
    res.write("		</d:propstat>");
    res.write("	</d:response>");
}