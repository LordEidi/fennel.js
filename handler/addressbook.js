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
var VCARD = require('../libs/db').VCARD;
var ADB = require('../libs/db').ADB;

// Exporting.
module.exports = {
    propfind: propfind,
    proppatch: proppatch,
    report: report,
    options: options,
    put: put,
    get: gett,
    delete: del,
    move: move
};

function propfind(request)
{
    log.debug("addressbook.propfind called");

    rh.setStandardHeaders(request);
    rh.setDAVHeaders(request);

    var res = request.getRes();
    res.writeHead(207);
    res.write(xh.getXMLHead());

    var response = "";

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/A:propfind/A:prop', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:caldav",
        C: 'http://calendarserver.org/ns/',
        D: "http://me.com/_namespace/"
    });
    var childs = node.childNodes();

    var isRoot = true;

    // if URL element size === 4, this is a call for the root URL of a user.
    // TODO:
    if(request.getUrlElementSize() > 4)
    {
        isRoot = false;
    }

    request.dontCloseResAutomatically();

    var username = request.getUser().getUserName();

    // respond for root and every addressbook
    if(isRoot === true)
    {
        response += returnPropfindRootProps(request, childs);

        var defaults = {
            pkey: generateUUIDv4(),
            ownerId: username,
            name: 'default',
            synctoken: 0
        };

        // check out if we already have a record for the default addressbook
        // if not, lets create it, otherwise let's return its values...
        ADB.findOrCreate({where: {ownerId: username, name: defaults.name},  defaults: defaults }).spread(function(adb, created)
        {
            VCARD.findAndCountAll(
                { where: {addressbookId: adb.pkey}}
            ).then(function(rsVCARDS)
                {
                    response += returnPropfindProps(request, childs, adb, rsVCARDS);

                    if(created)
                    {
                        adb.save().then(function()
                        {
                            log.warn('adb saved');
                        });
                    }

                    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
                    res.write(response);
                    res.write("</d:multistatus>");

                    request.closeRes();
                });
        });
    }
    else
    {
        var adbName = request.getPathElement(3);

        // check out if we already have a record for the default addressbook
        // if not, lets create it, otherwise let's return its values...
        ADB.find({ where: {ownerId: username, name: adbName} }).then(function(adb)
        {
            VCARD.findAndCountAll(
                { where: {addressbookId: adb.pkey}}
            ).then(function(rsVCARDS)
                {
                    response += returnPropfindProps(request, childs, adb, rsVCARDS);

                    res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
                    res.write(response);
                    res.write("</d:multistatus>");

                    request.closeRes();
                });
        });
    }
}

function generateUUIDv4()
{
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    uuid = uuid.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    return uuid;
}

function returnPropfindRootProps(request, nodes, adb, rsVCARD)
{
    var response = "<d:response><d:href>" + request.getURL() + "</d:href>";

    response += "<d:propstat>";
    response += "<d:prop>";

    var responseEtag = "";

    var username = request.getUser().getUserName();

    var len = nodes.length;
    for (var i=0; i < len; ++i)
    {
        var child = nodes[i];
        var name = child.name();
        switch(name)
        {
            case 'add-member':
                response += "";
                break;
            case 'bulk-requests':
                response += "";
                break;
            case 'current-user-privilege-set':
                response += getCurrentUserPrivilegeSet();
                break;
            case 'displayname':
                response += "";
                break;
            case 'max-image-size':
                response += "";
                break;
            case 'max-resource-size':
                response += "";
                break;
            case 'me-card':
                response += "";
                break;
            case 'owner':
                response += "<d:owner><d:href>/p/" + username + "/</d:href></d:owner>";
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
            case 'resource-id':
                response += "";
                break;
            case 'resourcetype':
                response += "<d:resourcetype><d:collection/></d:resourcetype>";
                break;
            case 'supported-report-set':
                response += getSupportedReportSet();
                break;
            case 'sync-token':
                response += "";
                break;
            case 'getctag':
                response += "";
                break;
            case 'getetag':
                responseEtag += returnADBETag(request, rsVCARD);
                break;

            default:
                if(name != 'text') log.warn("CARD-PropFind Root: not handled: " + name);
                break;
        }
    }

    response += "</d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";

    if(responseEtag.length > 0)
    {
        response += responseEtag;
    }

    return response;
}

function returnADBETag(request, rsVCARD)
{
    var response = "";

    for (var j=0; j < rsVCARD.count; ++j)
    {
        var vcard = rsVCARD.rows[j];

        var date = Date.parse(vcard.updatedAt);

        response += "<d:response>";
        response += "<d:href>" + request.getURL() + vcard.pkey + ".vcf</d:href>";
        response += "<d:propstat>";
        response += "<d:prop>";
        response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
        response += "</d:prop>";
        response += "<d:status>HTTP/1.1 200 OK</d:status>";
        response += "</d:propstat>";
        response += "</d:response>";
    }

    return response;
}

function returnPropfindProps(request, nodes, adb, rsVCARD)
{
    var username = request.getUser().getUserName();

    var response = "<d:response><d:href>/card/" + username + "/" + adb.name + "/</d:href>";

    response += "<d:propstat>";
    response += "<d:prop>";

    var responseEtag = "";

    var len = nodes.length;
    for (var i=0; i < len; ++i)
    {
        var child = nodes[i];
        var name = child.name();
        switch(name)
        {
            case 'add-member':
                response += "";
                break;
            case 'bulk-requests':
                response += "";
                break;
            case 'current-user-privilege-set':
                response += getCurrentUserPrivilegeSet();
                break;
            case 'displayname':
                response += "";
                break;
            case 'max-image-size':
                response += "";
                break;
            case 'max-resource-size':
                response += "";
                break;
            case 'me-card':
                response += "";
                break;
            case 'owner':
                response += "<d:owner><d:href>/p/" + username + "/</d:href></d:owner>";
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
            case 'resource-id':
                response += "";
                break;
            case 'resourcetype':
                response += "<d:resourcetype><d:collection/><card:addressbook/></d:resourcetype>";
                break;
            case 'supported-report-set':
                response += getSupportedReportSet();
                break;
            case 'sync-token':
                response += "";
                break;
            case 'getetag':
                responseEtag += returnADBETag(request, rsVCARD);
                break;

            default:
                if(name != 'text') log.warn("CARD-PropFind: not handled: " + name);
                break;
        }
    }

    response += "</d:prop>";
    response += "<d:status>HTTP/1.1 200 OK</d:status>";
    response += "</d:propstat>";
    response += "</d:response>";

    if(responseEtag.length > 0)
    {
        response += responseEtag;
    }

    return response;
}


function del(request)
{
    /*
    log.debug("calendar.delete called");

    var res = request.getRes();

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Server", "Fennel");

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

            request.closeRes();
        });
    }
    else
    {
        var ics_id = request.getFilenameFromPath(true);

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

            request.closeRes();
        });
    }
*/
}

function gett(request)
{
    log.debug("calendar.get called");

    var res = request.getRes();
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");

    request.dontCloseResAutomatically();

    var vcardId = request.getFilenameFromPath(true);
    VCARD.find({ where: {pkey: vcardId} }).then(function(vcard)
    {
        if(vcard === null)
        {
            log.warn('err: could not find vcard');
        }
        else
        {
            var res = request.getRes();

            var content = vcard.content;
            //content = content.replace(/\r\n|\r|\n/g,'&#13;\r\n');

            res.write(content);
        }

        request.closeRes();
    });
}

function put(request)
{
    // PUT /addressbooks/a3298271331/fruux-merged/68a386ea-be30-4922-a407-890b56bf944d.vcf HTTP/1.1
    // X-ADDRESSBOOKSERVER-KIND:group -> is_group === true

    log.debug("addressbook.put called");

    var vcardId = request.getFilenameFromPath(true);
    var addressbookId = request.getLastPathElement();

    var body = request.getBody();

    var match = body.search(/X-ADDRESSBOOKSERVER-KIND:group/);
    var isGroup = (match >= 0);

    var username = request.getUser().getUserName();

    var adbName = request.getPathElement(3);

    // check out if we already have a record for the default addressbook
    // if not, lets create it, otherwise let's return its values...
    ADB.find({ where: {ownerId: username, name: adbName} }).then(function(adb)
    {
        var defaults = {
            addressbookId: adb.pkey,
            content: body,
            ownerId: request.getUser().getUserName(),
            is_group: isGroup
        };

        // check out if we already have a record for the default addressbook
        // if not, lets create it, otherwise let's return its values...
        VCARD.findOrCreate({where: { pkey: vcardId },  defaults: defaults }).spread(function(vcard, created)
            {
                if(created)
                {
                    log.debug('Created VCARD: ' + JSON.stringify(vcard, null, 4));
                }
                else
                {
                    vcard.content = request.getBody();
                    vcard.is_group = isGroup;
                    log.debug('Loaded VCARD: ' + JSON.stringify(vcard, null, 4));
                }

                vcard.save().then(function()
                {
                    log.info('vcard updated');

                    // update addressbook collection
                    /*
                    ADB.find({ where: {pkey: addressbookId} } ).then(function(cal)
                    {
                        if(cal !== null && cal !== undefined)
                        {
                            cal.increment('synctoken', { by: 1 }).then(function()
                            {
                                log.info('synctoken on cal updated');
                            });
                        }
                    });
                    */
                });
            });
    });

    rh.setStandardHeaders(request);

    var res = request.getRes();

    var date = new Date();
    res.setHeader("ETag", Number(date));

    res.writeHead(201);
}

function move(request)
{
    /*
    log.debug("calendar.move called");

    rh.setStandardHeaders(request);

    var ics_id = request.getFilenameFromPath(true);
    var calendar = request.getLastPathElement();

    var destination = "";

    var req = request.getReq();
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

    var res = request.getRes();
    res.writeHead(201);
    */
}

function  getSupportedReportSet()
{
    var response = "";

    response += "<d:supported-report-set>";
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
    /*
     REPORT /addressbooks/a3298271331/fruux-merged/ HTTP/1.1

     <B:addressbook-multiget xmlns:B="urn:ietf:params:xml:ns:carddav">
     <A:prop xmlns:A="DAV:">
     <A:getetag/>
     <B:address-data/>
     </A:prop>
     <A:href xmlns:A="DAV:">/addressbooks/a3298271331/fruux-merged/55b786f0-166b-4548-9bf3-1c4499fb3339.vcf</A:href>
     <A:href xmlns:A="DAV:">/addressbooks/a3298271331/fruux-merged/68a386ea-be30-4922-a407-890b56bf944d.vcf</A:href>
     </B:addressbook-multiget><?xml version="1.0" encoding="utf-8"?>
    */

    log.debug("addressbook.report called");

    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(200);
    res.write(xh.getXMLHead());

    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var rootNode = xmlDoc.root();

    var name = rootNode.name();
    switch(name)
    {
        case 'addressbook-multiget':
            handleReportAdressbookMultiget(request);
            break;

        default:
            if(name != 'text') log.warn("P-R: not handled: " + name);
            break;
    }
}

function handleReportAdressbookMultiget(request)
{
    var body = request.getBody();
    var xmlDoc = xml.parseXml(body);

    var node = xmlDoc.get('/B:addressbook-multiget', {
        A: 'DAV:',
        B: "urn:ietf:params:xml:ns:carddav",
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
                    arrHrefs.push(parseHrefToVCARDId(child.text()));
                    break;

                default:
                    if(name != 'text') log.warn("ADB-R: not handled: " + name);
                    break;
            }
        }

        request.dontCloseResAutomatically();

        handleReportHrefs(request, arrHrefs);
    }
}

function parseHrefToVCARDId(href)
{
    var e = href.split("/");
    var id = e[e.length - 1];

    return id.substr(0, id.length - 4);
}

function handleReportHrefs(request, arrVCARDIds)
{
    VCARD.findAndCountAll( { where: {pkey: arrVCARDIds}}).then(function(result)
    {
        var response = "";

        for (var i=0; i < result.count; ++i)
        {
            var vcard = result.rows[i];

            var date = Date.parse(vcard.updatedAt);

            var content = vcard.content;
            content = content.replace(/&/g,'&amp;');
            content = content.replace(/\r\n|\r|\n/g,'&#13;\r\n');

            response += "<d:response>";
            response += "<d:href>" + request.getURL() + vcard.pkey + ".vcf</d:href>";
            response += "<d:propstat><d:prop>";
            response += "<card:address-data>" + content + "</card:address-data>";
            response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
            response += "</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>";
            response += "</d:response>";
        }

        var res = request.getRes();

        res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" >\r\n");

        res.write(response);

        res.write("</d:multistatus>\r\n");


        request.closeRes();
    });
}

function proppatch(request)
{
    log.debug("addressbook.proppatch called");

    /*
    rh.setStandardHeaders(request);

    var res = request.getRes();
    res.writeHead(200);

    res.write(xh.getXMLHead());

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

                res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" xmlns:ical=\"http://apple.com/ns/ical/\">\r\n");
                res.write("	<d:response>\r\n");
                res.write("		<d:href>" + request.getURL() + "</d:href>\r\n");
                res.write("		<d:propstat>\r\n");
                res.write("			<d:prop>\r\n");
                res.write(response);
                res.write("			</d:prop>\r\n");
                res.write("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
                res.write("		</d:propstat>\r\n");
                res.write("	</d:response>\r\n");
                res.write("</d:multistatus>\r\n");
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

                cal.save().then(function()
                {
                    log.warn('cal saved');
                });

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
            }

            request.closeRes();
        });
    }
    */
}