/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014-17 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var xml = require("libxmljs");
var xh = require("../libs/xmlhelper");
var log = require('../libs/log').log;

// Exporting.
module.exports = {
    propfind: propfind,
    proppatch: proppatch,
    report: report,
    options: options
};

function propfind(comm)
{
    log.debug("principal.propfind called");

    comm.setStandardHeaders();
    comm.setDAVHeaders();
    comm.setResponseCode(207);

    comm.appendResBody(xh.getXMLHead());

    var body = comm.getReqBody();
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
                response += getSupportedReportSet(comm);
                break;

            case 'principal-URL':
                response += "<d:principal-URL><d:href>/p/" + comm.getUser().getUserName() + "/</d:href></d:principal-URL>\r\n";
                break;

            case 'displayname':
                response += "<d:displayname>" + comm.getUser().getUserName() + "</d:displayname>";
                break;

            case 'principal-collection-set':
                response += "<d:principal-collection-set><d:href>/p/</d:href></d:principal-collection-set>";
                break;

            case 'current-user-principal':
                response += "<d:current-user-principal><d:href>/p/" + comm.getUser().getUserName() + "/</d:href></d:current-user-principal>";
                break;

            case 'calendar-home-set':
                response += "<cal:calendar-home-set><d:href>/cal/" + comm.getUser().getUserName() + "</d:href></cal:calendar-home-set>";
                break;

            case 'schedule-outbox-URL':
                response += "<cal:schedule-outbox-URL><d:href>/cal/" + comm.getUser().getUserName() + "/outbox</d:href></cal:schedule-outbox-URL>";
                break;

            case 'calendar-user-address-set':
                response += getCalendarUserAddressSet(comm);
                break;

            case 'notification-URL':
                response += "<cs:notification-URL><d:href>/cal/" + comm.getUser().getUserName() + "/notifications/</d:href></cs:notification-URL>";
                break;

            case 'getcontenttype':
                response += "";
                break;

            case 'addressbook-home-set':
                response += "<card:addressbook-home-set><d:href>/card/" + comm.getUser().getUserName() + "/</d:href></card:addressbook-home-set>";
                break;

            case 'directory-gateway':
                response += "";
                break;
            case 'email-address-set':
                response += "<cs:email-address-set><cs:email-address>lord test at swordlord.com</cs:email-address></cs:email-address-set>";
                break;
            case 'resource-id':
                response += "";
                break;

            default:
                if(name != 'text') log.warn("P-PF: not handled: " + name);
                break;
        }
    }

    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    comm.appendResBody("<d:response><d:href>" + comm.getURL() + "</d:href>");
    comm.appendResBody("<d:propstat>");
    comm.appendResBody("<d:prop>");
    comm.appendResBody(response);
    comm.appendResBody("</d:prop>");
    comm.appendResBody("<d:status>HTTP/1.1 200 OK</d:status>");
    comm.appendResBody("</d:propstat>");
    comm.appendResBody("</d:response>");
    comm.appendResBody("</d:multistatus>");

    comm.flushResponse();
}

function getCalendarUserAddressSet(comm)
{
    var response = "";

    response += "        <cal:calendar-user-address-set>\r\n";
    response += "        	<d:href>mailto:lord test at swordlord.com</d:href>\r\n";
    response += "        	<d:href>/p/" + comm.getUser().getUserName() + "/</d:href>\r\n";
    response += "        </cal:calendar-user-address-set>\r\n";

    return response;
}

function getSupportedReportSet(comm)
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

function options(comm)
{
    log.debug("principal.options called");

    comm.pushOptionsResponse();
}

function report(comm)
{
    log.debug("principal.report called");

    comm.setStandardHeaders();

    var body = comm.getReqBody();
    if(!body)
    {
        log.warn("principal.report called with no body");

        comm.setResponseCode(500);
        comm.appendResBody("Internal Server Error");
        comm.flushResponse();
        return;
    }

    comm.setResponseCode(200);
    comm.appendResBody(xh.getXMLHead());

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
                    response += getPrincipalSearchPropertySet(comm);
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
                response += getPrincipalSearchPropertySet(comm);
                break;

            default:
                if(name != 'text') log.warn("P-R: not handled: " + name);
                break;
        }
    }

    // TODO: clean up
    comm.appendResBody(response);

    if(isReportPropertyCalendarProxyWriteFor(comm))
    {
        replyPropertyCalendarProxyWriteFor(comm);
    }

    comm.flushResponse();
}


function getPrincipalSearchPropertySet(comm)
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


function isReportPropertyCalendarProxyWriteFor(comm)
{
    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:expand-property/A:property[@name=\'calendar-proxy-write-for\']', { A: 'DAV:', C: 'http://calendarserver.org/ns/'});

    return typeof node != 'undefined';
}

function replyPropertyCalendarProxyWriteFor(comm)
{
    var url = comm.getURL();
    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    comm.appendResBody("<d:response>");
    comm.appendResBody("    <d:href>" + url + "</d:href>");
    comm.appendResBody("    <d:propstat>");
    comm.appendResBody("       <d:prop>");
    comm.appendResBody("           <cs:calendar-proxy-read-for/>");
    comm.appendResBody("           <cs:calendar-proxy-write-for/>");
    comm.appendResBody("       </d:prop>");
    comm.appendResBody("        <d:status>HTTP/1.1 200 OK</d:status>");
    comm.appendResBody("    </d:propstat>");
    comm.appendResBody("</d:response>");
    comm.appendResBody("</d:multistatus>\r\n");
}

function proppatch(comm)
{
    log.debug("principal.proppatch called");

    comm.setStandardHeaders(comm);

    var url = comm.getURL();
    comm.setResponseCode(200);

    comm.appendResBody("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
    comm.appendResBody("	<d:response>\r\n");
    comm.appendResBody("		<d:href>" + url + "</d:href>\r\n");
    comm.appendResBody("		<d:propstat>\r\n");
    comm.appendResBody("			<d:prop>\r\n");
    comm.appendResBody("				<cal:default-alarm-vevent-date/>\r\n");
    comm.appendResBody("			</d:prop>\r\n");
    comm.appendResBody("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
    comm.appendResBody("		</d:propstat>\r\n");
    comm.appendResBody("	</d:response>\r\n");
    comm.appendResBody("</d:multistatus>\r\n");

    comm.flushResponse();
}

