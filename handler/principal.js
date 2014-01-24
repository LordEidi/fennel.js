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

function propfind(request)
{
    log.debug("principal.propfind called");

    rh.setStandardHeaders(request);
    rh.setDAVHeaders(request);

    var res = request.getRes();
    res.writeHead(207);
    res.write(xh.getXMLHead());

    if(isPropfindChecksumVersion(request))
    {
        replyChecksumVersion(request);
    }

    if(isPropfindSynctoken(request))
    {
        replyPropfindSynctoken(request);
    }

    if(isPropfindSupportedReportSet(request))
    {
        replyPropfindSupportedReportSet(request);
    }
    else if(isPrincipalURL(request))
    {
        replyPrincipalURL(request);
    }
}

function options(request)
{
    log.debug("principal.options called");

    rh.setStandardHeaders(request);
    rh.setDAVHeaders(request);

    var res = request.getRes();
    res.writeHead(200);
}

function report(request)
{
    console.log("Call REPORT");

    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(200);
    res.write(xh.getXMLHead());

    if(isReportPrincipalSearchPropertySet(request))
    {
        replyPrincipalSearchPropertySet(request);
    }

    if(isReportPropertyCalendarProxyWriteFor(request))
    {
        replyPropertyCalendarProxyWriteFor(request);
    }
}

function isPrincipalURL(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:principal-URL', { A: 'DAV:' });

    return typeof node != 'undefined';
}

function replyPrincipalURL(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("  <d:response>\r\n");
    res.write("    <d:href>" + url + "</d:href>\r\n");
    res.write("    <d:propstat>\r\n");
    res.write("      <d:prop>\r\n");
    res.write("        <d:principal-URL>\r\n");
    res.write("        		<d:href>/p/" + request.getUser().getUserName() + "/</d:href>\r\n");
    res.write("        </d:principal-URL>\r\n");
    res.write("      </d:prop>\r\n");
    res.write("		<d:status>HTTP/1.1 200 OK</d:status>\r\n");
    res.write("    </d:propstat>\r\n");
    res.write("  </d:response>\r\n");
    res.write("</d:multistatus>\r\n");
}

function isReportPrincipalSearchPropertySet(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:principal-search-property-set', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPrincipalSearchPropertySet(request)
{
    var res = request.getRes();
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
}

function isReportPropertyCalendarProxyWriteFor(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:expand-property/A:property[@name=\'calendar-proxy-write-for\']', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropertyCalendarProxyWriteFor(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("<d:response>");
    res.write("    <d:href>" + url + "</d:href>");
    res.write("    <d:propstat>");
    res.write("       <d:prop>");
    res.write("           <cs:calendar-proxy-read-for/>");
    res.write("           <cs:calendar-proxy-write-for/>");
    res.write("       </d:prop>");
    res.write("        <d:status>HTTP/1.1 200 OK</d:status>");
    res.write("    </d:propstat>");
    res.write("</d:response>");
    res.write("</d:multistatus>\r\n");
}

function proppatch(request)
{
    console.log("Call PROPPATCH");

    rh.setStandardHeaders(request);

    var url = request.getURL();
    var res = request.getRes();
    res.writeHead(200);

    res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("	<d:response>\r\n");
    res.write("		<d:href>" + url + "</d:href>\r\n");
    res.write("		<d:propstat>\r\n");
    res.write("			<d:prop>\r\n");
    res.write("				<cal:default-alarm-vevent-date/>\r\n");
    res.write("			</d:prop>\r\n");
    res.write("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
    res.write("		</d:propstat>\r\n");
    res.write("	</d:response>\r\n");
    res.write("</d:multistatus>\r\n");
}

function isPropfindChecksumVersion(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/C:checksum-versions', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyChecksumVersion(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>" + url + "</d:href></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindSynctoken(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:sync-token', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindSynctoken(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response>");
    res.write("<d:href>" + url + "</d:href>");
    res.write("<d:propstat><d:prop>");
    res.write("<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>");
    res.write("<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag></d:prop>");
    res.write("<d:status>HTTP/1.1 200 OK</d:status>");
    res.write("</d:propstat></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindSupportedReportSet(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:supported-report-set', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindSupportedReportSet(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("  <d:response>\r\n");
    res.write("    <d:href>" + url + "</d:href>\r\n");
    res.write("    <d:propstat>\r\n");
    res.write("      <d:prop>\r\n");
    res.write("        <d:principal-URL>\r\n");
    res.write("        		<d:href>/p/" + request.getUser().getUserName() + "/</d:href>\r\n");
    res.write("        </d:principal-URL>\r\n");
    res.write("        <d:displayname>lord test</d:displayname>\r\n");
    res.write("        <d:principal-collection-set>\r\n");
    res.write("        	<d:href>/p/uid/</d:href>\r\n");
    res.write("        </d:principal-collection-set>\r\n");
    res.write("        <d:current-user-principal>\r\n");
    res.write("        	<d:href>/p/" + request.getUser().getUserName() + "/</d:href>\r\n");
    res.write("        </d:current-user-principal>\r\n");
    res.write("        <cal:calendar-home-set>\r\n");
    res.write("        	<d:href>/cal/" + request.getUser().getUserName() + "</d:href>\r\n");
    res.write("        </cal:calendar-home-set>\r\n");
    res.write("        <cal:schedule-outbox-URL>\r\n");
    res.write("            <d:href>/cal/" + request.getUser().getUserName() + "/outbox</d:href>\r\n");
    res.write("        </cal:schedule-outbox-URL>\r\n");
    res.write("        <cal:calendar-user-address-set>\r\n");
    res.write("        	<d:href>mailto:lord test at swordlord.com</d:href>\r\n");
    res.write("        	<d:href>/p/" + request.getUser().getUserName() + "/</d:href>\r\n");
    res.write("        </cal:calendar-user-address-set>\r\n");
    res.write("        <cs:notification-URL>\r\n");
    res.write("        	<d:href>/cal/" + request.getUser().getUserName() + "/notifications/</d:href>\r\n");
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

function isPropfindContenttype(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:getcontenttype', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindContenttype(request)
{
    var url = request.getURL();
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>" + url + "</d:href></d:response>");
    res.write("</d:multistatus>");
}
