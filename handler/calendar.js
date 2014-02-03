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
var ICS = require('../libs/db').ICS;
var CAL = require('../libs/db').CAL;

// Exporting.
module.exports = {
    propfind: propfind,
    proppatch: proppatch,
    report: report,
    options: options,
    makeCalendar: makeCalendar,
    put: put,
    get: gett,
    delete: del,
    move: move
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

    var isRoot = true;

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO: check if the current user is the user requesting the resource (ACL)
    if(request.getUrlElementSize() > 4)
    {
        var lastPathElement = request.getFilenameFromPath(false);
        if(request.stringEndsWith(lastPathElement, '.ics'))
        {
            isRoot = false;
        }
    }

    request.dontCloseResAutomatically();

    if(isRoot === true)
    {
        var calendarId = request.getPathElement(3);

        CAL.find({ where: {pkey: calendarId} }).success(function(cal)
        {
            if(cal === null)
            {
                log.warn('err: could not find calendar');
            }
            else
            {
                cal.destroy().success(function()
                {
                    log.debug('calendar deleted');
                })
            }

            request.closeRes();
        });
    }
    else
    {
        var ics_id = request.getFilenameFromPath(true);

        ICS.find( { where: {pkey: ics_id}}).success(function(ics)
        {
            if(ics === null)
            {
                log.warn('err: could not find ics');
            }
            else
            {
                ics.destroy().success(function()
                {
                    log.debug('ics deleted');
                })
            }

            request.closeRes();
        });
    }

}

function gett(request)
{
    log.debug("calendar.get called");

    var res = request.getRes();
    res.setHeader("Content-Type", "text/calendar");

    request.dontCloseResAutomatically();

    var ics_id = request.getFilenameFromPath(true);
    ICS.find( { where: {pkey: ics_id}}).success(function(ics)
    {
        if(ics === null)
        {
            log.warn('err: could not find ics');
        }
        else
        {
            var res = request.getRes();

            res.write(ics.content);
        }

        request.closeRes();
    });
}

function put(request)
{
    log.debug("calendar.put called");

    var ics_id = request.getFilenameFromPath(true);
    var calendar = request.getLastPathElement();

    ICS.findOrCreate({ pkey: ics_id },
        {
            calendarId: calendar,
            content: request.getBody()
        }).success(function(ics, created)
        {
            if(created)
            {
                log.debug('Created ICS: ' + JSON.stringify(ics, null, 4));
            }
            else
            {
                ics.content = request.getBody();
                log.debug('Loaded ICS: ' + JSON.stringify(ics, null, 4));
            }

            ics.save().success(function()
            {
                log.warn('ics updated');
            });
        });

    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(201);
}

function move(request)
{
    log.debug("calendar.move called");

    rh.setStandardHeaders(request);

    var ics_id = request.getFilenameFromPath(true);
    var calendar = request.getLastPathElement();

    var destination = "";

    var req = request.getReq();
    for(var header in req.headers)
    {
        if(header === "destination")
        {
            destination = req.headers[header];
        }
    }

    if(destination.length > 0)
    {
        var aURL = destination.split("/");
        var newCal = aURL[aURL.length - 2];

        ICS.find({ where: {pkey: ics_id} }).success(function(ics)
        {
            if(ics === null)
            {
                log.warn('ics not found');
            }
            else
            {
                ics.calendarId = newCal;
                ics.save().success(function()
                {
                    log.warn('ics updated');
                });
            }
        });
    }


    /*
    * MOVE /calendars/a3298271331/4fa1e8c7-3b9b-4511-a774-69c98ae3eb3c/DCF54725-7E07-4427-8F66-6EF589E0282F.ics HTTP/1.1
     Host: 127.0.0.1:8081
     Destination: http://127.0.0.1:8081/calendars/a3298271331/84437DC2-2586-4D5D-B4C0-499EF6072152/DCF54725-7E07-4427-8F66-6EF589E0282F.ics
    * */

    var res = request.getRes();
    res.writeHead(201);
}

function propfind(request)
{
    log.debug("calendar.propfind called");

    rh.setStandardHeaders(request);
    rh.setDAVHeaders(request);

    var res = request.getRes();
    res.writeHead(207);
    res.write(xh.getXMLHead());

    var response = "";

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop', {   A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });
    var childs = node.childNodes();

    var isRoot = true;
    var username = request.getUser().getUserName();

    // if last element === username, then get all calendar info of user, otherwise only from that specific calendar
    //var lastelement = request.getLastPathElement();

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO:
    if(request.getUrlElementSize() > 4)
    {
        isRoot = false;
    }
    else if(request.getURL() === "/")
    {
        response += "<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">";

        var len = childs.length;
        for (var i=0; i < len; ++i)
        {
            var child = childs[i];
            var name = child.name();
            switch(name)
            {
                case 'calendar-free-busy-set':
                    response += "<d:response><d:href>/</d:href></d:response>";
                    break;

                case 'current-user-principal':
                    response += "<d:response><d:href>/</d:href>";
                    response += "<d:propstat><d:prop><d:current-user-principal><d:href>/p/" + username + "/</d:href></d:current-user-principal></d:prop>";
                    response += "<d:status>HTTP/1.1 200 OK</d:status>";
                    response += "</d:propstat>";
                    response += "</d:response>";
                    break;

                case 'principal-collection-set':
                    response += "<d:principal-collection-set><d:href>/p/</d:href></d:principal-collection-set>";
                    break;
            }
        }

        response += "</d:multistatus>";
        res.write(response);
        return;
    }

    request.dontCloseResAutomatically();

    if(isRoot === true)
    {
        // first get the root node info
        response += "<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">";
        response += getCalendarRootNodeResponse(request, childs);

        // then add info for all further known calendars of same user
        CAL.findAndCountAll({ where: {owner: username}, order: [['order', 'ASC']] }).success(function(result)
        {
            for (var i=0; i < result.count; ++i)
            {
                var calendar = result.rows[i];

                response += returnCalendar(request, calendar, childs);
            }

            response += returnOutbox(request);
            response += returnNotifications(request);

            response += "</d:multistatus>";
            res.write(response);
            request.closeRes();
        });
    }
    else
    {
        // otherwise get that specific calendar information
        var calendarId = request.getPathElement(3);
        if(calendarId === "notifications")
        {
            response += returnNotifications(request);
            res.write(response);
            request.closeRes();
        }
        else if(calendarId === "outbox")
        {
            response += returnOutbox(request);
            res.write(response);
            request.closeRes();
        }
        else
        {
            CAL.find({ where: {pkey: calendarId} }).success(function(cal)
            {
                if(cal === null)
                {
                    log.warn('Calendar not found');
                }
                else
                {
                    response += returnPropfindElements(request, cal, childs);

                    var res = request.getRes();
                    //log.debug(ics.calendar);
                    //res.write(ics.calendar);

                    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
                    res.write("<d:response><d:href>" + request.getURL() + "</d:href>");
                    res.write("<d:propstat>");
                    res.write("<d:prop>");
                    res.write(response);
                    res.write("</d:prop>");
                    res.write("<d:status>HTTP/1.1 200 OK</d:status>");
                    res.write("</d:propstat>");
                    res.write("</d:response>");
                    res.write("</d:multistatus>");
                }

                request.closeRes();
            });
        }
    }
}

function returnPropfindElements(request, calendar, childs)
{
    var response = "";

    var username = request.getUser().getUserName();

    var len = childs.length;
    for (var i=0; i < len; ++i)
    {
        var child = childs[i];
        var name = child.name();
        switch(name)
        {
            case 'add-member':
                response += "";
                break;

            case 'allowed-sharing-modes':
                response += "<cs:allowed-sharing-modes><cs:can-be-shared/><cs:can-be-published/></cs:allowed-sharing-modes>";
                break;

            case 'autoprovisioned':
                response += "";
                break;

            case 'bulk-requests':
                response += "";
                break;

            case 'calendar-color':
                response += "<xical:calendar-color xmlns:xical=\"http://apple.com/ns/ical/\">" + calendar.colour + "</x6:calendar-color>";
                break;

            case 'calendar-description':
                response += "";
                break;

            case 'calendar-free-busy-set':
                response += "";
                break;

            case 'calendar-order':
                response += "<xical:calendar-order xmlns:xical=\"http://apple.com/ns/ical/\">" + calendar.order + "</x6:calendar-order>";
                break;

            case 'calendar-timezone':
                var timezone = calendar.timezone;
                timezone = timezone.replace(/\r\n|\r|\n/g,'&#13;\r\n');

                response += "<cal:calendar-timezone>" + timezone + "</cal:calendar-timezone>";
                break;

            case 'current-user-privilege-set':
                response += getCurrentUserPrivilegeSet();
                break;

            case 'default-alarm-vevent-date':
                response += "";
                break;

            case 'default-alarm-vevent-datetime':
                response += "";
                break;

            case 'displayname':
                response += "<d:displayname>" + calendar.displayname + "</d:displayname>";
                break;

            case 'language-code':
                response += "";
                break;

            case 'location-code':
                response += "";
                break;

            case 'owner':
                response += "<d:owner><d:href>/p/" + username +"/</d:href></d:owner>";
                break;

            case 'pre-publish-url':
                response += "<cs:pre-publish-url><d:href>https://127.0.0.1/cal/" + username + "/" + calendar.pkey + "</d:href></cs:pre-publish-url>";
                break;

            case 'publish-url':
                response += "";
                break;

            case 'push-transports':
                response += "";
                break;

            case 'pushkey':
                response += "";
                break;

            case 'quota-available-bytes':
                response += "";
                break;

            case 'quota-used-bytes':
                response += "";
                break;

            case 'refreshrate':
                response += "";
                break;

            case 'resource-id':
                response += "";
                break;

            case 'resourcetype':
                response += "<d:resourcetype><d:collection/><cal:calendar/></d:resourcetype>";
                break;

            case 'schedule-calendar-transp':
                response += "<cal:schedule-calendar-transp><cal:opaque/></cal:schedule-calendar-transp>";
                break;

            case 'schedule-default-calendar-URL':
                response += "";
                break;

            case 'source':
                response += "";
                break;

            case 'subscribed-strip-alarms':
                response += "";
                break;

            case 'subscribed-strip-attachments':
                response += "";
                break;

            case 'subscribed-strip-todos':
                response += "";
                break;

            case 'supported-calendar-component-set':
                response += "";
                break;

            case 'supported-calendar-component-sets':
                response += "<cal:supported-calendar-component-set><cal:comp name=\"VEVENT\"/></cal:supported-calendar-component-set>";
                break;

            case 'supported-report-set':
                response += getSupportedReportSet();
                break;

            case 'getctag':
                response += "<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag>";
                break;

            case 'getetag':
                // no response?
                break;

            case 'checksum-versions':
                // no response?
                break;

            case 'sync-token':
                response += "<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>";
                break;

            case 'acl':
                response += getACL(request);
                break;

            default:
                if(name != 'text') log.warn("CAL-PF: not handled: " + name);
                break;
        }
    }

    return response;
}

function returnCalendar(request, calendar, childs)
{
    var response = "";
    var username = request.getUser().getUserName();

    response += "	<d:response>";
    response += "		<d:href>/cal/" + username + "/" + calendar.pkey + "/</d:href>";
    response += "		<d:propstat>";
    response += "			<d:prop>";

    response += returnPropfindElements(request, calendar, childs);

    response += "			</d:prop>";
    response += "			<d:status>HTTP/1.1 200 OK</d:status>";
    response += "		</d:propstat>";
    response += "	</d:response>";

    return response;
}

function getCalendarRootNodeResponse(request, childs)
{
    var response = "";

    var owner = request.getUser().getUserName();

    response += "<d:response><d:href>" + request.getURL() + "</d:href>";
    response += "<d:propstat>";
    response += "<d:prop>";

    var len = childs.length;
    for (var i = 0; i < len; ++i)
    {
        var child = childs[i];
        var name = child.name();
        switch(name)
        {
            case 'current-user-privilege-set':
                response += getCurrentUserPrivilegeSet();
                break;

            case 'owner':
                response += "<d:owner><d:href>/p/" + owner +"/</d:href></d:owner>";
                break;

            case 'resourcetype':
                response += "<d:resourcetype><d:collection/></d:resourcetype>";
                break;

            case 'supported-report-set':
                response += getSupportedReportSet();
                break;
        }
    }

    response += "</d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";


    return response;
}

function  getSupportedReportSet()
{
    var response = "";

    response += "<d:supported-report-set>";

    response += "<d:supported-report><d:report><cal:calendar-multiget/></d:report></d:supported-report>";
    response += "<d:supported-report><d:report><cal:calendar-query/></d:report></d:supported-report>";
    response += "<d:supported-report><d:report><cal:free-busy-query/></d:report></d:supported-report>";

    response += "<d:supported-report><d:report><d:sync-collection/></d:report></d:supported-report>";
    response += "<d:supported-report><d:report><d:expand-property/></d:report></d:supported-report>";
    response += "<d:supported-report><d:report><d:principal-property-search/></d:report></d:supported-report>";
    response += "<d:supported-report><d:report><d:principal-search-property-set/></d:report></d:supported-report>";
    response += "</d:supported-report-set>";

    return response;
}


function  getCurrentUserPrivilegeSet()
{
    var response = "";

    response += "<d:current-user-privilege-set>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:read-free-busy/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:write/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:write-acl/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:write-content/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:write-properties/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:bind/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:unbind/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:unlock/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:read/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:read-acl/></d:privilege>";
    response += "<d:privilege xmlns:d=\"DAV:\"><d:read-current-user-privilege-set/></d:privilege>";
    response += "</d:current-user-privilege-set>";

    return response;
}

function getACL(request)
{
    var username = request.getUser().getUserName();
    var response = "";

    response += "<d:acl>";
    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/" + username + "</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:read/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/" + username + "</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:write/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/" + username + "/calendar-proxy-write/</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:read/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/" + username + "/calendar-proxy-write/</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:write/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/" + username + "/calendar-proxy-read/</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:read/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:authenticated/></d:principal>";
    response += "        <d:grant><d:privilege><cal:read-free-busy/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    response += "    <d:ace>";
    response += "        <d:principal><d:href>/p/system/admins/</d:href></d:principal>";
    response += "        <d:grant><d:privilege><d:all/></d:privilege></d:grant>";
    response += "        <d:protected/>";
    response += "    </d:ace>";

    return response;
}

function makeCalendar(request)
{
    log.debug("calendar.makeCalendar called");

    var response = "";

    rh.setStandardHeaders(request);

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:mkcalendar/A:set/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    var childs = node.childNodes();
    var res = request.getRes();

    var timezone,
    order,
    free_busy_set,
    supported_cal_component,
    colour,
    displayname;

    var len = childs.length;
    if(len > 0)
    {
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
                    if(name != 'text') log.warn("CAL-MK: not handled: " + name);
                    break;
            }
        }

        //node.childNodes()[1].attr("symbolic-color").value()
        //node.childNodes()[1].text()
        var filename = request.getLastPathElement(true);

        CAL.findOrCreate({ pkey: filename },
            {
                owner: request.getUser().getUserName(),
                timezone: timezone,
                order: order,
                free_busy_set: free_busy_set,
                supported_cal_component: supported_cal_component,
                colour: colour,
                displayname: displayname
            }).success(function(cal, created)
            {
                if(created)
                {
                    log.debug('Created CAL: ' + JSON.stringify(cal, null, 4));
                }
                else
                {
                    log.debug('Loaded CAL: ' + JSON.stringify(cal, null, 4));
                }

                cal.save().success(function()
                {
                    log.warn('cal saved');
                });
            });

        res.writeHead(201);
        res.write(response);
    }
    else
    {
        res.writeHead(500);
        res.write(response);
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
    log.debug("calendar.report called");

    rh.setStandardHeaders(request);

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

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propertyupdate/A:set/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });
    var childs = node.childNodes();

    var isRoot = true;

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO:
    if(request.getUrlElementSize() > 4)
    {
        var lastPathElement = request.getFilenameFromPath(false);
        if(request.stringEndsWith(lastPathElement, '.ics'))
        {
            isRoot = false;
        }
    }

    request.dontCloseResAutomatically();

    var response = "";

    if(isRoot)
    {
        var calendarId = request.getLastPathElement(false);
        CAL.find({ where: {pkey: calendarId} }).success(function(cal)
        {
            if(cal === null)
            {
                log.warn('Calendar not found');
            }
            else
            {
                var len = childs.length;
                for (var i=0; i < len; ++i)
                {
                    var child = childs[i];
                    var name = child.name();
                    switch(name)
                    {
                        case 'default-alarm-vevent-date':
                            response += "<cal:default-alarm-vevent-date/>";
                            log.info("proppatch default-alarm-vevent-date not handled yet");
                            break;

                        case 'default-alarm-vevent-datetime':
                            response += "<cal:default-alarm-vevent-datetime/>";
                            log.info("proppatch default-alarm-vevent-datetime not handled yet");
                            break;

                        case 'displayname':
                            response += "<cal:displayname/>";
                            cal.displayname = child.text();
                            break;

                        case 'calendar-timezone':
                            response += "<cal:calendar-timezone/>";
                            cal.timezone = child.text();
                            break;

                        case 'calendar-color':
                            response += "<ical:calendar-color/>";
                            cal.colour = child.text();
                            break;

                        case 'calendar-order':
                            response += "<ical:calendar-order/>";
                            cal.order = child.text();
                            break;

                        default:
                            if(name != 'text') log.warn("CAL-PP: not handled: " + name);
                            break;
                    }
                }

                cal.save().success(function()
                {
                    log.warn('cal saved');
                });
            }

            res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
            res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
            res.write("	<d:response>\r\n");
            res.write("		<d:href>" + request.getURL() + "</d:href>\r\n");
            res.write("		<d:propstat>\r\n");
            res.write("			<d:prop>\r\n");
            res.write(response);
            res.write("			</d:prop>\r\n");
            res.write("			<d:status>HTTP/1.1 200 OK</d:status>\r\n");
            res.write("		</d:propstat>\r\n");
            res.write("	</d:response>\r\n");
            res.write("</d:multistatus>\r\n");

            request.closeRes();
        });
    }
}

function returnOutbox(request)
{
    var response = "";

    var username = request.getUser().getUserName();

    response += "<d:response>";
    response += "   <d:href>/cal/" + username + "/outbox/</d:href>";
    response += "    <d:propstat>";
    response += "        <d:prop>";
    response += "            <d:current-user-privilege-set>";
    response += "               <d:privilege xmlns:d=\"DAV:\">";
    response += "                   <d:read/>";
    response += "               </d:privilege>";
    response += "               <d:privilege xmlns:d=\"DAV:\">";
    response += "                   <d:read-acl/>";
    response += "               </d:privilege>";
    response += "               <d:privilege xmlns:d=\"DAV:\">";
    response += "                   <d:read-current-user-privilege-set/>";
    response += "               </d:privilege>";
    response += "               <d:privilege xmlns:d=\"DAV:\">";
    response += "                   <d:schedule-post-vevent xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>";
    response += "               </d:privilege>";
    response += "               <d:privilege xmlns:d=\"DAV:\">";
    response += "                   <d:schedule-query-freebusy xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>";
    response += "               </d:privilege>";
    response += "           </d:current-user-privilege-set>";
    response += "           <d:owner>";
    response += "               <d:href>/p/" + username + "/</d:href>";
    response += "           </d:owner>";
    response += "           <d:resourcetype>";
    response += "              <d:collection/>";
    response += "               <cal:schedule-outbox/>";
    response += "           </d:resourcetype>";
    response += "           <d:supported-report-set>";
    response += "              <d:supported-report>";
    response += "                   <d:report>";
    response += "                       <d:expand-property/>";
    response += "                   </d:report>";
    response += "               </d:supported-report>";
    response += "               <d:supported-report>";
    response += "                   <d:report>";
    response += "                       <d:principal-property-search/>";
    response += "                   </d:report>";
    response += "               </d:supported-report>";
    response += "               <d:supported-report>";
    response += "                    <d:report>";
    response += "                       <d:principal-search-property-set/>";
    response += "                   </d:report>";
    response += "               </d:supported-report>";
    response += "            </d:supported-report-set>";
    response += "       </d:prop>";
    response += "       <d:status>HTTP/1.1 200 OK</d:status>";
    response += "   </d:propstat>";
    response += "</d:response>";

    return response;
}

function returnNotifications(request)
{
    var response = "";

    var username = request.getUser().getUserName();

    response += "<d:response>";
    response += "<d:href>/cal/" + username + "/notifications/</d:href>";
    response += "<d:propstat>";
    response += "    <d:prop>";
    response += "        <d:current-user-privilege-set>";
    response += "            <d:privilege xmlns:d=\"DAV:\">";
    response += "                <d:write/>";
    response += "           </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:write-acl/>";
    response += "           </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:write-properties/>";
    response += "          </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:write-content/>";
    response += "           </d:privilege>";
    response += "            <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:bind/>";
    response += "            </d:privilege>";
    response += "            <d:privilege xmlns:d=\"DAV:\">";
    response += "                <d:unbind/>";
    response += "            </d:privilege>";
    response += "            <d:privilege xmlns:d=\"DAV:\">";
    response += "                <d:unlock/>";
    response += "           </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:read/>";
    response += "           </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "                <d:read-acl/>";
    response += "           </d:privilege>";
    response += "           <d:privilege xmlns:d=\"DAV:\">";
    response += "               <d:read-current-user-privilege-set/>";
    response += "            </d:privilege>";
    response += "       </d:current-user-privilege-set>";
    response += "       <d:owner>";
    response += "           <d:href>/p/" + username + "/</d:href>";
    response += "       </d:owner>";
    response += "       <d:resourcetype>";
    response += "           <d:collection/>";
    response += "           <cs:notification/>";
    response += "       </d:resourcetype>";
    response += "       <d:supported-report-set>";
    response += "           <d:supported-report>";
    response += "               <d:report>";
    response += "                   <d:expand-property/>";
    response += "               </d:report>";
    response += "           </d:supported-report>";
    response += "           <d:supported-report>";
    response += "               <d:report>";
    response += "                   <d:principal-property-search/>";
    response += "               </d:report>";
    response += "           </d:supported-report>";
    response += "          <d:supported-report>";
    response += "               <d:report>";
    response += "                  <d:principal-search-property-set/>";
    response += "              </d:report>";
    response += "           </d:supported-report>";
    response += "       </d:supported-report-set>";
    response += "   </d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";

    return response;
}