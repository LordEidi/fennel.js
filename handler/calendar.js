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
var moment = require('moment');

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

function del(comm)
{
    log.debug("calendar.delete called");

    comm.setHeader("Content-Type", "text/html");
    comm.setHeader("Server", "Fennel");

    comm.setResponseCode(204);

    var isRoot = true;

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO: check if the current user is the user requesting the resource (ACL)
    if(comm.getUrlElementSize() > 4)
    {
        var lastPathElement = comm.getFilenameFromPath(false);
        if(comm.stringEndsWith(lastPathElement, '.ics'))
        {
            isRoot = false;
        }
    }

    if(isRoot === true)
    {
        var calendarId = comm.getPathElement(3);

        CAL.find({ where: {pkey: calendarId} }).then(function(cal)
        {
            if(cal === null)
            {
                log.warn('err: could not find calendar');
            }
            else
            {
                cal.destroy().then(function()
                {
                    log.debug('calendar deleted');
                })
            }

            comm.flushResponse();
        });
    }
    else
    {
        var ics_id = comm.getFilenameFromPath(true);

        ICS.find( { where: {pkey: ics_id}}).then(function(ics)
        {
            if(ics === null)
            {
                log.warn('err: could not find ics');
            }
            else
            {
                ics.destroy().then(function()
                {
                    log.debug('ics deleted');
                })
            }

            comm.flushResponse();
        });
    }

}

function gett(comm)
{
    log.debug("calendar.get called");

    comm.setHeader("Content-Type", "text/calendar");

    var ics_id = comm.getFilenameFromPath(true);
    ICS.find( { where: {pkey: ics_id}}).then(function(ics)
    {
        if(ics === null)
        {
            log.warn('err: could not find ics');
        }
        else
        {
            var content = ics.content;
            //content = content.replace(/\r\n|\r|\n/g,'&#13;\r\n');

            comm.appendResBody(content);
        }

        comm.flushResponse();
    });
}

function put(comm)
{
    log.debug("calendar.put called");

    var ics_id = comm.getFilenameFromPath(true);
    var calendar = comm.getCalIdFromURL();

    var body = comm.getReqBody();

    //console.log(body);

    var parser = require('../libs/parser');
    var pbody = parser.parseICS(body);

    var dtStart = moment(pbody.VCALENDAR.VEVENT.DTSTART);
    var dtEnd = moment(pbody.VCALENDAR.VEVENT.DTEND);

    // store dtstart and dtend per ICS record so that we can filter for this in the REPORT query
    var defaults = {
        calendarId: calendar,
        startDate: dtStart.toISOString(),
        endDate:  dtEnd.toISOString(),
        content: body
    };

    ICS.findOrCreate({ where: {pkey: ics_id}, defaults: defaults}).spread(function(ics, created)
    {
        if(created)
        {
            log.debug('Created ICS: ' + JSON.stringify(ics, null, 4));
        }
        else
        {
            var ifNoneMatch = comm.getHeader('If-None-Match');
            if(ifNoneMatch && ifNoneMatch === "*")
            {
                log.debug('If-None-Match matches, return status code 412');

                comm.setStandardHeaders();

                var date = new Date();
                comm.setHeader("ETag", Number(date));

                comm.setResponseCode(412);

                comm.appendResBody(xh.getXMLHead());

                comm.appendResBody("<d:error xmlns:d=\"DAV:\" xmlns:s=\"http://swordlord.org/ns\">");
                comm.appendResBody("<s:exception>Fennel\DAV\Exception\PreconditionFailed</s:exception>");
                comm.appendResBody("<s:message>An If-None-Match header was specified, but the ETag matched (or * was specified).</s:message>");
                comm.appendResBody("<s:header>If-None-Match</s:header>");
                comm.appendResBody("</d:error>");

                comm.flushResponse();
                return;
            }
            else
            {
                startDate = dtStart.toISOString();
                endDate = dtEnd.toISOString();

                ics.content = comm.getReqBody();
                log.debug('Loaded ICS: ' + JSON.stringify(ics, null, 4));
            }
        }

        ics.save().then(function()
        {
            log.info('ics updated');

            // update calendar collection
            CAL.findOne({ where: {pkey: calendar} } ).then(function(cal)
            {
                if(cal !== null && cal !== undefined)
                {
                    cal.increment('synctoken', { by: 1 }).then(function()
                    {
                        log.info('synctoken on cal updated');
                    });
                }
            });

            comm.setStandardHeaders();

            var date = new Date();
            comm.setHeader("ETag", Number(date));

            comm.setResponseCode(201);
            comm.flushResponse();
        });
    });
}

function move(comm)
{
    log.debug("calendar.move called");

    comm.setStandardHeaders();

    var ics_id = comm.getFilenameFromPath(true);
    var calendar = comm.getCalIdFromURL();

    var destination = "";

    var req = comm.getReq();
    var headers = req.headers;
    for(var header in headers)
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

        ICS.find({ where: {pkey: ics_id} }).then(function(ics)
        {
            if(ics === null)
            {
                log.warn('ics not found');
            }
            else
            {
                ics.calendarId = newCal;
                ics.save().then(function()
                {
                    log.warn('ics updated');
                });
            }
        });
    }

    comm.setResponseCode(201);
    comm.flushResponse();
}

function propfind(comm)
{
    log.debug("calendar.propfind called");

    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop', {   A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });
    var childs = node.childNodes();

    var username = comm.getUser().getUserName();

    /*
    How to handle PROPFIND Requests
    We handle these cases:
        - 1 /cal/USER/
        - 2 /cal/USER/CALENDAR_ID/
        - 3 /cal/USER/notifications/
        - 4 /cal/USER/inbox/
    */

    // find out if this PROPFIND request is for a specific user (1)
    if(comm.getUrlElementSize() === 4)
    {
        // get all calendar info of user
        handlePropfindForUser(comm);
        return;
    }

    var arrURL = comm.getURLAsArray();
    if(arrURL.length === 5)
    {
        // get all details from specified calendar
        var calendarId = arrURL[3];
        switch (calendarId) {
            case 'notifications':
                handlePropfindForCalendarNotifications(comm);
                break;
            case 'inbox':
                handlePropfindForCalendarInbox(comm);
                break;
            case 'outbox':
                handlePropfindForCalendarOutbox(comm);
                break;
            default:
                handlePropfindForCalendarId(comm, calendarId);
                break;
        }

        return;
    }

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO:
    if(comm.getURL() === "/")
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
        comm.appendResBody(response);
        comm.flushResponse();
        return;
    }

}

/**
 *
 * @param comm
 */
function handlePropfindForCalendarInbox(comm)
{
    comm.setStandardHeaders();
    comm.setDAVHeaders();

    comm.setResponseCode(207);
    comm.appendResBody(xh.getXMLHead());

    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    comm.appendResBody("<d:response><d:href>" + comm.getURL() + "</d:href>");
    comm.appendResBody("<d:propstat>");
    comm.appendResBody("<d:status>HTTP/1.1 200 OK</d:status>");
    comm.appendResBody("</d:propstat>");
    comm.appendResBody("</d:response>");
    comm.appendResBody("</d:multistatus>");

    comm.flushResponse();
}

function handlePropfindForCalendarOutbox(comm)
{
    comm.setStandardHeaders();
    comm.setDAVHeaders();

    comm.setResponseCode(207);
    comm.appendResBody(xh.getXMLHead());

    var response = returnOutbox(comm);
    comm.appendResBody(response);
    comm.flushResponse();
}

function handlePropfindForCalendarNotifications(comm)
{
    // response += returnNotifications(comm);
    // comm.appendResBody(response);
    comm.setStandardHeaders();
    comm.setDAVHeaders();

    comm.setResponseCode(207);
    comm.appendResBody(xh.getXMLHead());

    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
    comm.appendResBody("<d:response><d:href>" + comm.getURL() + "</d:href>");
    comm.appendResBody("<d:propstat>");
    comm.appendResBody("<d:status>HTTP/1.1 200 OK</d:status>");
    comm.appendResBody("</d:propstat>");
    comm.appendResBody("</d:response>");
    comm.appendResBody("</d:multistatus>");

    comm.flushResponse();
}

function handlePropfindForCalendarId(comm, calendarId)
{
    CAL.find({ where: {pkey: calendarId} }).then(function(cal)
    {
        comm.setStandardHeaders();
        comm.setDAVHeaders();

        comm.setResponseCode(207);
        comm.appendResBody(xh.getXMLHead());

        if(cal === null)
        {
            log.warn('Calendar not found: ' + calendarId);

            comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
            comm.appendResBody("<d:response>");
            comm.appendResBody("<d:href>/cal/" + comm.getUser().getUserName() + "/" + calendarId + "/</d:href>");
            comm.appendResBody("<d:propstat>");
            comm.appendResBody("<d:status>HTTP/1.1 404 Not Found</d:status>");
            comm.appendResBody("</d:propstat>");
            comm.appendResBody("</d:response>");
            comm.appendResBody("</d:multistatus>");
        }
        else
        {
            // for every ICS element, return the props...
            var xmlDoc = xml.parseXml(comm.getReqBody());

            var node = xmlDoc.get('/A:propfind/A:prop', {   A: 'DAV:',
                B: "urn:ietf:params:xml:ns:caldav",
                C: 'http://calendarserver.org/ns/',
                D: "http://apple.com/ns/ical/",
                E: "http://me.com/_namespace/"
            });
            var childs = node.childNodes();

            var response = returnPropfindElements(comm, cal, childs);
            comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
            comm.appendResBody("<d:response><d:href>" + comm.getURL() + "</d:href>");

            if(response.length > 0)
            {
                comm.appendResBody("<d:propstat>");
                comm.appendResBody("<d:prop>");
                comm.appendResBody(response);
                comm.appendResBody("</d:prop>");
                comm.appendResBody("<d:status>HTTP/1.1 200 OK</d:status>");
                comm.appendResBody("</d:propstat>");
            }
            else
            {
                // TODO: not necessarily clever to do...
                comm.appendResBody("<d:propstat>");
                comm.appendResBody("<d:status>HTTP/1.1 404 Not Found</d:status>");
                comm.appendResBody("</d:propstat>");
            }
            comm.appendResBody("</d:response>");
            comm.appendResBody("</d:multistatus>");
        }

        comm.flushResponse();
    });
}

/**
 *
 * @param comm
 */
function handlePropfindForUser(comm)
{
    comm.setStandardHeaders();
    comm.setDAVHeaders();

    comm.setResponseCode(207);
    comm.appendResBody(xh.getXMLHead());

    var response = "";

    var xmlDoc = xml.parseXml(comm.getReqBody());
    var nodeChecksum = xmlDoc.get('/A:propfind/A:prop/C:checksum-versions', {   A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    if(nodeChecksum !== undefined)
    {
        response += "<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">";
        response += "<d:response><d:href>" + comm.getURL() + "</d:href></d:response>";
        response += "</d:multistatus>";
        comm.appendResBody(response);
        comm.flushResponse();
    }
    else
    {
        // for every ICS element, return the props...
        var xmlDoc = xml.parseXml(comm.getReqBody());

        var node = xmlDoc.get('/A:propfind/A:prop', {   A: 'DAV:',
            B: "urn:ietf:params:xml:ns:caldav",
            C: 'http://calendarserver.org/ns/',
            D: "http://apple.com/ns/ical/",
            E: "http://me.com/_namespace/"
        });
        var childs = node.childNodes();

        // first get the root node info
        response += "<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">";
        response += getCalendarRootNodeResponse(comm, childs);

        var username = comm.getUserIdFromURL();

        // then add info for all further known calendars of same user
        var query = { where: {owner: username}, order: [['order', 'ASC']] };

        CAL.findAndCountAll({ where: {owner: username}, order: [['order', 'ASC']] }).then(function(result)
        {
            for (var i=0; i < result.count; ++i)
            {
                var calendar = result.rows[i];

                response += returnCalendar(comm, calendar, childs);
            }

            response += returnOutbox(comm);
            response += returnNotifications(comm);

            response += "</d:multistatus>";
            comm.appendResBody(response);
            comm.flushResponse();
        });
    }
}

function returnPropfindElements(comm, calendar, childs)
{
    var response = "";

    var username = comm.getUser().getUserName();

    var token = calendar.synctoken;

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
                response += "<xical:calendar-color xmlns:xical=\"http://apple.com/ns/ical/\">" + calendar.colour + "</xical:calendar-color>";
                break;

            case 'calendar-description':
                response += "";
                break;

            case 'calendar-free-busy-set':
                response += "";
                break;

            case 'calendar-order':
                response += "<xical:calendar-order xmlns:xical=\"http://apple.com/ns/ical/\">" + calendar.order + "</xical:calendar-order>";
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

            // TODO Fix URL
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
                response += getSupportedReportSet(false);
                break;

            case 'getctag':
                response += "<cs:getctag>http://swordlord.com/ns/sync/" + token + "</cs:getctag>";
                break;

            case 'getetag':
                // no response?
                break;

            case 'checksum-versions':
                // no response?
                break;

            case 'sync-token':
                response += "<d:sync-token>http://swordlord.com/ns/sync/" + token + "</d:sync-token>";
                break;

            case 'acl':
                response += getACL(comm);
                break;

            case 'getcontenttype':
                //response += "<d:getcontenttype>text/calendar;charset=utf-8</d:getcontenttype>";
                break;

            default:
                if(name != 'text') log.warn("CAL-PF: not handled: " + name);
                break;
        }
    }

    return response;
}

function returnCalendar(comm, calendar, childs)
{
    var response = "";
    var username = comm.getUser().getUserName();

    response += "	<d:response>";
    response += "		<d:href>/cal/" + username + "/" + calendar.pkey + "/</d:href>";
    response += "		<d:propstat>";
    response += "			<d:prop>";

    response += returnPropfindElements(comm, calendar, childs);

    response += "			</d:prop>";
    response += "			<d:status>HTTP/1.1 200 OK</d:status>";
    response += "		</d:propstat>";
    response += "	</d:response>";

    return response;
}

function getCalendarRootNodeResponse(comm, childs)
{
    var response = "";

    var owner = comm.getUser().getUserName();

    response += "<d:response><d:href>" + comm.getURL() + "</d:href>";
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
                response += getSupportedReportSet(true);
                break;
        }
    }

    response += "</d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";


    return response;
}

function  getSupportedReportSet(isRoot)
{
    var response = "";

    response += "<d:supported-report-set>";

    if(!isRoot)
    {
        response += "<d:supported-report><d:report><cal:calendar-multiget/></d:report></d:supported-report>";
        response += "<d:supported-report><d:report><cal:calendar-query/></d:report></d:supported-report>";
        response += "<d:supported-report><d:report><cal:free-busy-query/></d:report></d:supported-report>";
    }

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
    response += "<d:privilege xmlns:d=\"DAV:\"><cal:read-free-busy/></d:privilege>";
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

function getACL(comm)
{
    var username = comm.getUser().getUserName();
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

function makeCalendar(comm)
{
    log.debug("calendar.makeCalendar called");

    var response = "";

    comm.setStandardHeaders();

    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:mkcalendar/A:set/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    var childs = node.childNodes();

    var timezone;
    var order;
    var free_busy_set = "";
    var supported_cal_component;
    var colour = "#44A703FF";
    var displayname;

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

        if(colour === undefined || colour.length === 0) { colour = "#0E61B9FF"; }

        //node.childNodes()[1].attr("symbolic-color").value()
        //node.childNodes()[1].text()
        var filename = comm.getCalIdFromURL();

        var defaults = {
            owner: comm.getUser().getUserName(),
            timezone: timezone,
            order: order,
            free_busy_set: free_busy_set,
            supported_cal_component: supported_cal_component,
            colour: colour,
            displayname: displayname
        };

        CAL.findOrCreate({ where: {pkey: filename}, defaults: defaults }).spread(function(cal, created)
            {
                if(created)
                {
                    log.debug('Created CAL: ' + JSON.stringify(cal, null, 4));
                }
                else
                {
                    log.debug('Loaded CAL: ' + JSON.stringify(cal, null, 4));
                }

                cal.save().then(function()
                {
                    log.warn('cal saved');
                });
            });

        comm.setResponseCode(201);
        comm.appendResBody(response);
        comm.flushResponse();
    }
    else
    {
        comm.setResponseCode(500);
        comm.appendResBody(response);
        comm.flushResponse();
    }
}

function options(comm)
{
    log.debug("principal.options called");

    comm.pushOptionsResponse();
}

function report(comm)
{
    log.debug("calendar.report called");

    comm.setStandardHeaders();
    comm.setResponseCode(207);

    comm.appendResBody(xh.getXMLHead());

    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var rootNode = xmlDoc.root();

    var name = rootNode.name();
    switch(name)
    {
        case 'sync-collection':
            handleReportSyncCollection(comm);
            break;

        case 'calendar-multiget':
            handleReportCalendarMultiget(comm);
            break;

        case 'calendar-query':
            handleReportCalendarQuery(comm, xmlDoc);
            break;

        default:
            if(name != 'text') log.warn("P-R: not handled: " + name);
            break;
    }
}

function handleReportCalendarQuery(comm, xmlDoc)
{
    var calendarId = comm.getCalIdFromURL();

    var filter = {calendarId: calendarId};

    // TODO: check filter:
    // <B:comp-filter name=\"VCALENDAR\">\n\r";
    //    <B:comp-filter name=\"VEVENT\">\n\r";
    //    <B:time-range start=\"" + now.subtract(1, "h").format("YMMDD[T]HH0000[Z]") + "\"/>\n\r";
    //    </B:comp-filter>\n\r";
    //</B:comp-filter>\n\r
    //
    // BEGIN:VEVENT.
    // DTSTART;TZID=Europe/Zurich:20161014T120000Z.
    // DTEND;TZID=Europe/Zurich:20161014T130000Z
    // parse when storing

    var nodeFilter = xmlDoc.get('/B:calendar-query/B:filter/B:comp-filter[@name = "VCALENDAR"]/B:comp-filter[@name = "VEVENT"]/B:time-range', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });
    if(nodeFilter !== undefined)
    {
        var attrs = nodeFilter.attrs();
        var len = attrs.length;

        for (var i=0; i < len; i++)
        {
            var attr = attrs[i];

            switch(attr.name())
            {
                case 'start':
                    var filterStart = moment(attr.value());
                    filter.startDate = { $gte: filterStart.toISOString() };
                    break;

                case 'end':
                    var filterEnd = moment(attr.value());
                    filter.endDate = { $lte: filterEnd.toISOString() };
                    break;

                default:
                    break;
            }
        }
    }

    CAL.find({ where: {pkey: calendarId} } ).then(function(cal)
    {
        // TODO: filter according to calendar-query.comp-filter
        ICS.findAndCountAll( { where: filter}
            ).then(function(result)
            {
                var nodeProp = xmlDoc.get('/B:calendar-query/A:prop', {
                    A: 'DAV:',
                    B: "urn:ietf:params:xml:ns:caldav",
                    C: 'http://calendarserver.org/ns/',
                    D: "http://apple.com/ns/ical/",
                    E: "http://me.com/_namespace/"
                });

                var nodeFilter = xmlDoc.get('/B:filter', {
                    A: 'DAV:',
                    B: "urn:ietf:params:xml:ns:caldav",
                    C: 'http://calendarserver.org/ns/',
                    D: "http://apple.com/ns/ical/",
                    E: "http://me.com/_namespace/"
                });

                var response = "";

                var nodeProps = nodeProp.childNodes();
                var len = nodeProps.length;

                var reqUrl = comm.getURL();
                reqUrl += reqUrl.match("\/$") ? "" : "/";

                for (var j=0; j < result.count; j++)
                {
                    var ics = result.rows[j];

                    response += "<d:response><d:href>" + reqUrl + ics.pkey + ".ics</d:href>";
                    response += "<d:propstat>";
                    response += "<d:prop>";

                    var date = Date.parse(ics.updatedAt);

                    for (var i=0; i < len; i++)
                    {
                        var child = nodeProps[i];
                        var name = child.name();
                        switch(name)
                        {
                            case 'getetag':
                                response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
                                break;

                            case 'getcontenttype':
                                response += "<d:getcontenttype>text/calendar; charset=utf-8; component=" + cal.supported_cal_component + "</d:getcontenttype>";
                                break;

                            case 'calendar-data':
                                response += "<cal:calendar-data>" + ics.content + "</cal:calendar-data>"; // has to be cal: since a few lines below the namespace is cal: not c:
                                break;

                            default:
                                if(name != 'text') log.warn("P-R: not handled: " + name);
                                break;
                        }
                    }

                    response += "</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>";
                    response += "</d:response>";
                }

                comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
                comm.appendResBody(response);
                comm.appendResBody("</d:multistatus>");

                comm.flushResponse();
            });
    });

    /*
    *
    * <?xml version="1.0" encoding="UTF-8"?>
     <B:calendar-query xmlns:B="urn:ietf:params:xml:ns:caldav">
     <A:prop xmlns:A="DAV:">
        <A:getetag/>
        <A:getcontenttype/>
     </A:prop>
     <B:filter>
        <B:comp-filter name="VCALENDAR">
           <B:comp-filter name="VEVENT">
              <B:time-range start="20140107T000000Z"/>
           </B:comp-filter>
        </B:comp-filter>
     </B:filter>
     </B:calendar-query>
    * */
}

function handleReportSyncCollection(comm)
{
    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:sync-collection', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    if(node != undefined)
    {
        var calendarId = comm.getPathElement(3);

        CAL.find({ where: {pkey: calendarId} } ).then(function(cal)
        {
            ICS.findAndCountAll(
                { where: {calendarId: calendarId}}
//                { where: {updatedAt: { gte: cal.updatedAt}}}
            ).then(function(result)
            {
                var response = "";

                for (var j=0; j < result.count; ++j)
                {
                    var ics = result.rows[j];

                    var childs = node.childNodes();

                    var len = childs.length;
                    for (var i=0; i < len; ++i)
                    {
                        var child = childs[i];
                        var name = child.name();
                        switch(name)
                        {
                            case 'sync-token':
                                break;

                            case 'prop':
                                response += handleReportCalendarProp(comm, child, cal, ics);
                                break;

                            default:
                                if(name != 'text') log.warn("P-R: not handled: " + name);
                                break;
                        }
                    }

                }

                comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
                comm.appendResBody(response);
                comm.appendResBody("<d:sync-token>http://swordlord.org/ns/sync/" + cal.synctoken + "</d:sync-token>");
                comm.appendResBody("</d:multistatus>");

                comm.flushResponse();
            });
        });
    }
}

function handleReportCalendarProp(comm, node, cal, ics)
{
    var response = "";

    var reqUrl = comm.getURL();
    reqUrl += reqUrl.match("\/$") ? "" : "/";

    response += "<d:response>";
    response += "<d:href>" + reqUrl + ics.pkey + ".ics</d:href>";
    response += "<d:propstat><d:prop>";

    var childs = node.childNodes();

    var date = Date.parse(ics.updatedAt);

    var len = childs.length;
    for (var i=0; i < len; ++i)
    {
        var child = childs[i];
        var name = child.name();
        switch(name)
        {
            case 'getetag':
                response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
                break;

            case 'getcontenttype':
                response += "<d:getcontenttype>text/calendar; charset=utf-8; component=" + cal.supported_cal_component + "</d:getcontenttype>";
                break;

            default:
                if(name != 'text') log.warn("P-R: not handled: " + name);
                break;
        }
    }

    response += "</d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";

    return response;
}

function handleReportCalendarMultiget(comm)
{
    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:calendar-multiget', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://apple.com/ns/ical/",
        E: "http://me.com/_namespace/"
    });

    if(node != undefined)
    {
        var childs = node.childNodes();

        var arrHrefs = [];

        var len = childs.length;
        for (var i=0; i < len; ++i)
        {
            var child = childs[i];
            var name = child.name();
            switch(name)
            {
                case 'prop': // TODO: theoretically we should first get the parameters ordered by the client, lets do so later :)
                    break;

                case 'href':
                    arrHrefs.push(parseHrefToIcsId(child.text()));
                    break;

                default:
                    if(name != 'text') log.warn("P-R: not handled: " + name);
                    break;
            }
        }

        handleReportHrefs(comm, arrHrefs);
    }
}

function parseHrefToIcsId(href)
{
    var e = href.split("/");
    var id = e[e.length - 1];

    return id.substr(0, id.length - 4);
}

function handleReportHrefs(comm, arrIcsIds)
{
    ICS.findAndCountAll( { where: {pkey: arrIcsIds}}).then(function(result)
    {
        var response = "";

        for (var i=0; i < result.count; ++i)
        {
            var ics = result.rows[i];

            var date = Date.parse(ics.updatedAt);

            var reqUrl = comm.getURL();
            reqUrl += reqUrl.match("\/$") ? "" : "/";

            response += "<d:response>";
            response += "<d:href>" + reqUrl + ics.pkey + ".ics</d:href>";
            response += "<d:propstat><d:prop>";
            response += "<cal:calendar-data>" + ics.content + "</cal:calendar-data>";
            response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
            response += "</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>";
            response += "<d:propstat><d:prop>";
            response += "<cs:created-by/><cs:updated-by/>";
            response += "</d:prop><d:status>HTTP/1.1 404 Not Found</d:status></d:propstat>";
            response += "</d:response>";
        }

        comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
        comm.appendResBody(response);
        comm.appendResBody("</d:multistatus>\r\n");

        comm.flushResponse();
    });
}

function proppatch(comm)
{
    log.debug("calendar.proppatch called");

    comm.setStandardHeaders();

    comm.setResponseCode(200);

    comm.appendResBody(xh.getXMLHead());

    var body = comm.getReqBody();
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
    if(comm.getUrlElementSize() > 4)
    {
        var lastPathElement = comm.getFilenameFromPath(false);
        if(comm.stringEndsWith(lastPathElement, '.ics'))
        {
            isRoot = false;
        }
    }

    var response = "";

    if(isRoot)
    {
        var calendarId = comm.getCalIdFromURL();
        CAL.find({ where: {pkey: calendarId} }).then(function(cal)
        {
            if(cal === null)
            {
                log.warn('Calendar not found');

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

                        default:
                            if(name != 'text') log.warn("CAL-PP: not handled: " + name);
                            break;
                    }
                }

                comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
                comm.appendResBody("	<d:response>\r\n");
                comm.appendResBody("		<d:href>" + comm.getURL() + "</d:href>\r\n");
                comm.appendResBody("		<d:propstat>\r\n");
                comm.appendResBody("			<d:prop>\r\n");
                comm.appendResBody(response);
                comm.appendResBody("			</d:prop>\r\n");
                comm.appendResBody("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
                comm.appendResBody("		</d:propstat>\r\n");
                comm.appendResBody("	</d:response>\r\n");
                comm.appendResBody("</d:multistatus>\r\n");
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
                            response += "<cal:displayname>" + child.text() + "</cal:displayname>";
                            cal.displayname = child.text();
                            break;

                        case 'calendar-timezone':
                            response += "<cal:calendar-timezone/>";
                            cal.timezone = child.text();
                            break;

                        case 'calendar-color':
                            response += "<ical:calendar-color>" + child.text() + "</ical:calendar-color>";
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

                cal.save().then(function()
                {
                    log.warn('cal saved');
                });

                comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
                comm.appendResBody("	<d:response>\r\n");
                comm.appendResBody("		<d:href>" + comm.getURL() + "</d:href>\r\n");
                comm.appendResBody("		<d:propstat>\r\n");
                comm.appendResBody("			<d:prop>\r\n");
                comm.appendResBody(response);
                comm.appendResBody("			</d:prop>\r\n");
                comm.appendResBody("			<d:status>HTTP/1.1 200 OK</d:status>\r\n");
                comm.appendResBody("		</d:propstat>\r\n");
                comm.appendResBody("	</d:response>\r\n");
                comm.appendResBody("</d:multistatus>\r\n");
            }

            comm.flushResponse();
        });
    }
}

function returnOutbox(comm)
{
    var response = "";

    var username = comm.getUser().getUserName();

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

function returnNotifications(comm)
{
    var response = "";

    var username = comm.getUser().getUserName();

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