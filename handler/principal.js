/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014-15 by
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

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });
    var childs = node.childNodes();

    var response = "";

    var len = childs.length;
    for (var i=0; i < len; ++i)
    {
        var child = childs[i];
        var name = child.name();
        switch(name)
        {
            case 'checksum-versions':
                response += "";
                break;

            case 'sync-token':
                response += "<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>";
                break;

            case 'supported-report-set':
                response += getSupportedReportSet(request);
                break;

            case 'principal-URL':
                response += "<d:principal-URL><d:href>/p/" + request.getUser().getUserName() + "/</d:href></d:principal-URL>\r\n";
                break;

            case 'displayname':
                response += "<d:displayname>" + request.getUser().getUserName() + "</d:displayname>";
                break;

            case 'principal-collection-set':
                response += "<d:principal-collection-set><d:href>/p/</d:href></d:principal-collection-set>";
                break;

            case 'current-user-principal':
                response += "<d:current-user-principal><d:href>/p/" + request.getUser().getUserName() + "/</d:href></d:current-user-principal>";
                break;

            case 'calendar-home-set':
                response += "<cal:calendar-home-set><d:href>/cal/" + request.getUser().getUserName() + "</d:href></cal:calendar-home-set>";
                break;

            case 'schedule-outbox-URL':
                response += "<cal:schedule-outbox-URL><d:href>/cal/" + request.getUser().getUserName() + "/outbox</d:href></cal:schedule-outbox-URL>";
                break;

            case 'calendar-user-address-set':
                response += getCalendarUserAddressSet(request);
                break;

            case 'notification-URL':
                response += "<cs:notification-URL><d:href>/cal/" + request.getUser().getUserName() + "/notifications/</d:href></cs:notification-URL>";
                break;

            case 'getcontenttype':
                response += "";
                break;

            case 'addressbook-home-set':
                response += "<card:addressbook-home-set><d:href>/card/" + request.getUser().getUserName() + "/</d:href></card:addressbook-home-set>";
                break;

            case 'directory-gateway':
                response += "";
                break;
            case 'email-address-set':
                response += "";
                break;
            case 'resource-id':
                response += "";
                break;

            default:
                if(name != 'text') log.warn("P-PF: not handled: " + name);
                break;
        }
    }

    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    res.write("<d:response>");
    res.write("<d:propstat>");
    res.write("<d:prop>");
    res.write(response);
    res.write("</d:prop>");
    res.write("<d:status>HTTP/1.1 200 OK</d:status>");
    res.write("</d:propstat>");
    res.write("</d:response>");
    res.write("</d:multistatus>");
}

function getCalendarUserAddressSet(request)
{
    var response = "";

    response += "        <cal:calendar-user-address-set>\r\n";
    response += "        	<d:href>mailto:lord test at swordlord.com</d:href>\r\n";
    response += "        	<d:href>/p/" + request.getUser().getUserName() + "/</d:href>\r\n";
    response += "        </cal:calendar-user-address-set>\r\n";

    return response;
}

function getSupportedReportSet(request)
{
    var response = "";
    response += "        <d:supported-report-set>\r\n";
    response += "        	<d:supported-report>\r\n";
    response += "        		<d:report>\r\n";
    response += "        			<d:expand-property/>\r\n";
    response += "        		</d:report>\r\n";
    response += "        	</d:supported-report>\r\n";
    response += "        	<d:supported-report>\r\n";
    response += "        		<d:report>\r\n";
    response += "        			<d:principal-property-search/>\r\n";
    response += "        		</d:report>\r\n";
    response += "        	</d:supported-report>\r\n";
    response += "        	<d:supported-report>\r\n";
    response += "        		<d:report>\r\n";
    response += "        			<d:principal-search-property-set/>\r\n";
    response += "        		</d:report>\r\n";
    response += "        	</d:supported-report>\r\n";
    response += "        </d:supported-report-set>\r\n";

    return response;
}

function options(request)
{
    log.debug("principal.options called");

    var res = request.getRes();
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Server", "Fennel");

    rh.setDAVHeaders(request);
    rh.setAllowHeader(request);

    res.writeHead(200);
}

function report(request)
{
    log.debug("principal.report called");

    rh.setStandardHeaders(request);

    var res = request.getRes();

    var body = request.getBody();
    if(!body)
    {
        log.warn("principal.report called with no body");

        res.writeHead(500);
        res.write("Internal Server Error");
        return;
    }

    res.writeHead(200);
    res.write(xh.getXMLHead());

    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    var response = "";

    if(node != undefined)
    {
        var childs = node.childNodes();

        var len = childs.length;
        for (var i=0; i < len; ++i)
        {
            var child = childs[i];
            var name = child.name();
            switch(name)
            {
                case 'principal-search-property-set':
                    response += getPrincipalSearchPropertySet(request);
                    break;

                default:
                    if(name != 'text') log.warn("P-R: not handled: " + name);
                    break;
            }
        }
    }

    node = xmlDoc.get('/A:principal-search-property-set', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    if(node != undefined)
    {
        var name = node.name();
        switch(name)
        {
            case 'principal-search-property-set':
                response += getPrincipalSearchPropertySet(request);
                break;

            default:
                if(name != 'text') log.warn("P-R: not handled: " + name);
                break;
        }
    }

    // TODO: clean up
    res.write(response);

    if(isReportPropertyCalendarProxyWriteFor(request))
    {
        replyPropertyCalendarProxyWriteFor(request);
    }
}


function getPrincipalSearchPropertySet(request)
{
    var response = "";
    response += "<d:principal-search-property-set xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n";
    response += "  <d:principal-search-property>\r\n";
    response += "    <d:prop>\r\n";
    response += "      <d:displayname/>\r\n";
    response += "    </d:prop>\r\n";
    response += "    <d:description xml:lang=\"en\">Display name</d:description>\r\n";
    response += "  </d:principal-search-property>\r\n";
//    response += "  <d:principal-search-property>\r\n";
//    response += "    <d:prop>\r\n";
//    response += "      <s:email-address/>\r\n";
//    response += "    </d:prop>\r\n";
//    response += "    <d:description xml:lang=\"en\">Email address</d:description>\r\n";
//    response += "  </d:principal-search-property>\r\n";
    response += "</d:principal-search-property-set>\r\n";

    return response;
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
    log.debug("principal.proppatch called");

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

