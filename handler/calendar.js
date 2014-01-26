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
var url = require('url');
var ics = require('../libs/db').ICS;
var cal = require('../libs/db').CAL;

// Exporting.
module.exports = {
    propfind: propfind,
    proppatch: proppatch,
    report: report,
    options: options,
    makeCalendar: makeCalendar,
    put: put,
    get: gett,
    delete: del
};

function del(request)
{
    log.debug("calendar.delete called");

    var res = request.getRes();
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Server", "Fennel");
    res.setHeader("Cache-Control", "private, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.writeHead(204);
}

function gett(request)
{
    log.debug("calendar.get called");

    var filename = request.getFilenameFromPath();

    ics.all( { where: {id: filename}}, function(err, icss)
    {
        icss.forEach(function(ics) {
            var res = request.getRes();
            console.log(ics.calendar);
            res.write(ics.calendar);
            res.end();
        });
    });
}

function put(request)
{
    log.debug("calendar.put called");

    var filename = request.getFilenameFromPath();

    ics.updateOrCreate({
        id: filename,
        calendar: request.getBody()
    }, function(err, post){
        log.warn('err: ' + err);
        log.debug('post: ' + post);
    });

    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(204);
}

function propfind(request)
{
    log.debug("calendar.propfind called");

    rh.setStandardHeaders(request);
    rh.setDAVHeaders(request);

    var res = request.getRes();
    res.writeHead(207);
    res.write(xh.getXMLHead());

    if(isPropfindCalendarDescription(request))
    {
        replyPropfindCalendarDescription(request);
    }

    if(isPropfindChecksumVersion(request))
    {
        replyChecksumVersion(request);
    }

    if(isPropfindGetCTag(request))
    {
        replyGetCTag(request);
    }

    if(isPropfindGetETag(request))
    {
        replyGetETag(request);
    }

}

function makeCalendar(request)
{
    log.debug("calendar.makeCalendar called");

    if(isMakeCalendar(request))
    {
        handleMakeCalendar(request);
    }
}

function isMakeCalendar(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:mkcalendar', { A: 'DAV:', B: 'urn:ietf:params:xml:ns:caldav'});

    return typeof node != 'undefined';
}

function handleMakeCalendar(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:mkcalendar/A:set/A:prop', { A: 'DAV:', B: 'urn:ietf:params:xml:ns:caldav', D: 'http://apple.com/ns/ical/'});

    var childs = node.childNodes();

    var timezone,
    order,
    free_busy_set,
    supported_cal_component,
    colour,
    displayname;

    var len = childs.length;
    for (var i=0; i < len; ++i)
    {
        var child = childs[i];
        var name = child.name();
        switch(name)
        {
            case 'calendar-color':
                colour = child.text();
                break;

            case 'calendar-free-busy-set':
                free_busy_set = "YES";
                break;

            case 'displayname':
                displayname = child.text();
                break;

            case 'calendar-order':
                order = child.text();
                break;

            case 'supported-calendar-component-set':
                supported_cal_component = "VEVENT";
                break;

            case 'calendar-timezone':
                timezone = child.text();
                break;

            default:
                break;
        }
    }

    //node.childNodes()[1].attr("symbolic-color").value()
    //node.childNodes()[1].text()
    var filename = request.getLastPathElement();

    cal.updateOrCreate({
        id: filename,
        timezone: timezone,
        order: order,
        free_busy_set: free_busy_set,
        supported_cal_component: supported_cal_component,
        colour: colour,
        displayname: displayname
    }, function(err, post){
        if(err != null)
        {
            log.warn('err: ' + err);
            log.debug('post: ' + JSON.stringify(post, null, 4));
        }
    });

    var res = request.getRes();
    res.writeHead(201);
}


function isPropfindGetCTag(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:getctag', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyGetCTag(request)
{
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>" + request.getURL() + "</d:href></d:response>");
    res.write("<d:propstat><d:prop>");
    res.write("<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>");
    res.write("<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag>");
    res.write("</d:prop><d:status>HTTP/1.1 200 OK</d:status>");
    res.write("</d:propstat></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindGetETag(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:getetag', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyGetETag(request)
{
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>" + request.getURL() + "</d:href></d:response>");
    res.write("</d:multistatus>");
}

function options(request)
{
    log.debug("principal.options called");

    rh.setStandardHeaders(res);
    rh.setDAVHeaders(res);

    var res = request.getRes();
    res.writeHead(200);
}

function report(request)
{
    log.debug("calendar.report called");

    rh.setStandardHeaders(res);

    var res = request.getRes();
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
}

function proppatch(request)
{
    log.debug("calendar.proppatch called");

    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(200);

    if(isProppatchDefaultAlarmVeventDate(request))
    {
        replyDefaultAlarmVeventDate(request);
    }

    if(isProppatchDefaultAlarmVeventDatetime(request))
    {
        replyDefaultAlarmVeventDatetime(request);
    }
}

function isProppatchDefaultAlarmVeventDate(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propertyupdate/A:set/A:prop/B:default-alarm-vevent-date', { A: 'DAV:', B: 'urn:ietf:params:xml:ns:caldav', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyDefaultAlarmVeventDate(request)
{
    var res = request.getRes();
    res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("	<d:response>\r\n");
    res.write("		<d:href>" + request.getURL() + "</d:href>\r\n");
    res.write("		<d:propstat>\r\n");
    res.write("			<d:prop>\r\n");
    res.write("				<cal:default-alarm-vevent-date/>\r\n");
    res.write("			</d:prop>\r\n");
    res.write("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
    res.write("		</d:propstat>\r\n");
    res.write("	</d:response>\r\n");
    res.write("</d:multistatus>\r\n");
}


function isProppatchDefaultAlarmVeventDatetime(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propertyupdate/A:set/A:prop/B:default-alarm-vevent-datetime', { A: 'DAV:', B: 'urn:ietf:params:xml:ns:caldav', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyDefaultAlarmVeventDatetime(request)
{
    var res = request.getRes();
    res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    res.write("	<d:response>\r\n");
    res.write("		<d:href>" + request.getURL() + "</d:href>\r\n");
    res.write("		<d:propstat>\r\n");
    res.write("			<d:prop>\r\n");
    res.write("				<cal:default-alarm-vevent-datetime/>\r\n");
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
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response><d:href>" + request.getURL() + "</d:href></d:response>");
    res.write("</d:multistatus>");
}

function isPropfindCalendarDescription(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop/A:sync-token', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropfindCalendarDescription(request)
{
    var res = request.getRes();
    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\">");
    res.write("<d:response>");
    res.write("		<d:href>" + request.getURL() + "</d:href>");
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
    res.write("					<d:href>/p/" + request.getUser().getUserName() + "/</d:href>");
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

    returnCalendar(request, "108e8519-0957-4afb-a954-eb78a14d3382", "Tasks", 1, "VTODO");
    returnCalendar(request, "4fa1e8c7-3b9b-4511-a774-69c98ae3eb3c", "Calendar", 2, "VEVENT");

    returnOutbox(request);
    returnNotifications(request);

    res.write("</d:multistatus>");
}

function returnCalendar(request, uuid, name, oder, comp)
{
    var username = request.getUser().getUserName();
    var res = request.getRes();
    res.write("	<d:response>");
    res.write("		<d:href>/cal/" + username + "/" + uuid + "/</d:href>");
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
    res.write("					<d:href>/p/" + username + "/</d:href>");
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
    res.write("					<cal:comp name=\"" + comp + "\"/>");
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

function returnOutbox(request)
{
    var username = request.getUser().getUserName();
    var res = request.getRes();
    res.write("<d:response>");
    res.write("   <d:href>/cal/" + username + "/outbox/</d:href>");
    res.write("    <d:propstat>");
    res.write("        <d:prop>");
    res.write("            <d:current-user-privilege-set>");
    res.write("               <d:privilege xmlns:d=\"DAV:\">");
    res.write("                   <d:read/>");
    res.write("               </d:privilege>");
    res.write("               <d:privilege xmlns:d=\"DAV:\">");
    res.write("                   <d:read-acl/>");
    res.write("               </d:privilege>");
    res.write("               <d:privilege xmlns:d=\"DAV:\">");
    res.write("                   <d:read-current-user-privilege-set/>");
    res.write("               </d:privilege>");
    res.write("               <d:privilege xmlns:d=\"DAV:\">");
    res.write("                   <d:schedule-post-vevent xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>");
    res.write("               </d:privilege>");
    res.write("               <d:privilege xmlns:d=\"DAV:\">");
    res.write("                   <d:schedule-query-freebusy xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>");
    res.write("               </d:privilege>");
    res.write("           </d:current-user-privilege-set>");
    res.write("           <d:owner>");
    res.write("               <d:href>/p/" + username + "/</d:href>");
    res.write("           </d:owner>");
    res.write("           <d:resourcetype>");
    res.write("              <d:collection/>");
    res.write("               <cal:schedule-outbox/>");
    res.write("           </d:resourcetype>");
    res.write("           <d:supported-report-set>");
    res.write("              <d:supported-report>");
    res.write("                   <d:report>");
    res.write("                       <d:expand-property/>");
    res.write("                   </d:report>");
    res.write("               </d:supported-report>");
    res.write("               <d:supported-report>");
    res.write("                   <d:report>");
    res.write("                       <d:principal-property-search/>");
    res.write("                   </d:report>");
    res.write("               </d:supported-report>");
    res.write("               <d:supported-report>");
    res.write("                    <d:report>");
    res.write("                       <d:principal-search-property-set/>");
    res.write("                   </d:report>");
    res.write("               </d:supported-report>");
    res.write("            </d:supported-report-set>");
    res.write("       </d:prop>");
    res.write("       <d:status>HTTP/1.1 200 OK</d:status>");
    res.write("   </d:propstat>");
    res.write("</d:response>");
}

function returnNotifications(request)
{
    var username = request.getUser().getUserName();
    var res = request.getRes();
    res.write("<d:response>");
    res.write("<d:href>/cal/" + username + "/notifications/</d:href>");
    res.write("<d:propstat>");
    res.write("    <d:prop>");
    res.write("        <d:current-user-privilege-set>");
    res.write("            <d:privilege xmlns:d=\"DAV:\">");
    res.write("                <d:write/>");
    res.write("           </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:write-acl/>");
    res.write("           </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:write-properties/>");
    res.write("          </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:write-content/>");
    res.write("           </d:privilege>");
    res.write("            <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:bind/>");
    res.write("            </d:privilege>");
    res.write("            <d:privilege xmlns:d=\"DAV:\">");
    res.write("                <d:unbind/>");
    res.write("            </d:privilege>");
    res.write("            <d:privilege xmlns:d=\"DAV:\">");
    res.write("                <d:unlock/>");
    res.write("           </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:read/>");
    res.write("           </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("                <d:read-acl/>");
    res.write("           </d:privilege>");
    res.write("           <d:privilege xmlns:d=\"DAV:\">");
    res.write("               <d:read-current-user-privilege-set/>");
    res.write("            </d:privilege>");
    res.write("       </d:current-user-privilege-set>");
    res.write("       <d:owner>");
    res.write("           <d:href>/p/" + username + "/</d:href>");
    res.write("       </d:owner>");
    res.write("       <d:resourcetype>");
    res.write("           <d:collection/>");
    res.write("           <cs:notification/>");
    res.write("       </d:resourcetype>");
    res.write("       <d:supported-report-set>");
    res.write("           <d:supported-report>");
    res.write("               <d:report>");
    res.write("                   <d:expand-property/>");
    res.write("               </d:report>");
    res.write("           </d:supported-report>");
    res.write("           <d:supported-report>");
    res.write("               <d:report>");
    res.write("                   <d:principal-property-search/>");
    res.write("               </d:report>");
    res.write("           </d:supported-report>");
    res.write("          <d:supported-report>");
    res.write("               <d:report>");
    res.write("                  <d:principal-search-property-set/>");
    res.write("              </d:report>");
    res.write("           </d:supported-report>");
    res.write("       </d:supported-report-set>");
    res.write("   </d:prop>");
    res.write("<d:status>HTTP/1.1 200 OK</d:status>");
    res.write("</d:propstat>");
    res.write("</d:response>");
}