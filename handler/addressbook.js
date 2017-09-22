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

function propfind(comm)
{
    log.debug("addressbook.propfind called");

    comm.setStandardHeaders();
    comm.setDAVHeaders();

    comm.setResponseCode(207);
    comm.appendResBody(xh.getXMLHead());

    var response = "";

    var body = comm.getReqBody();
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
    if(comm.getUrlElementSize() > 4)
    {
        isRoot = false;
    }

    var username = comm.getUser().getUserName();

    // respond for root and every addressbook
    if(isRoot === true)
    {
        response += returnPropfindRootProps(comm, childs);

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
                    response += returnPropfindProps(comm, childs, adb, rsVCARDS);

                    if(created)
                    {
                        adb.save().then(function()
                        {
                            log.warn('adb saved');
                        });
                    }

                    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
                    comm.appendResBody(response);
                    comm.appendResBody("</d:multistatus>");

                    comm.flushResponse();
                });
        });
    }
    else
    {
        var adbName = comm.getPathElement(3);

        // check out if we already have a record for the default addressbook
        // if not, lets create it, otherwise let's return its values...
        ADB.find({ where: {ownerId: username, name: adbName} }).then(function(adb)
        {
            VCARD.findAndCountAll(
                { where: {addressbookId: adb.pkey}}
            ).then(function(rsVCARDS)
                {
                    response += returnPropfindProps(comm, childs, adb, rsVCARDS);

                    comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">");
                    comm.appendResBody(response);
                    comm.appendResBody("</d:multistatus>");

                    comm.flushResponse();
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

function returnPropfindRootProps(comm, nodes, adb, rsVCARD)
{
    var response = "<d:response><d:href>" + comm.getURL() + "</d:href>";

    response += "<d:propstat>";
    response += "<d:prop>";

    var responseEtag = "";

    var username = comm.getUser().getUserName();

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
                // TODO: let the user change the value of displayname
                response += "<d:displayname>Contacts</d:displayname>";
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
                responseEtag += returnADBETag(comm, rsVCARD);
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

function returnADBETag(comm, rsVCARD)
{
    var response = "";

    for (var j=0; j < rsVCARD.count; ++j)
    {
        var vcard = rsVCARD.rows[j];

        var date = Date.parse(vcard.updatedAt);

        response += "<d:response>";
        response += "<d:href>" + comm.getURL() + vcard.pkey + ".vcf</d:href>";
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

function returnPropfindProps(comm, nodes, adb, rsVCARD)
{
    var username = comm.getUser().getUserName();

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
                // TODO: let the user change the value of displayname
                response += "<d:displayname>Contacts</d:displayname>";
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
                responseEtag += returnADBETag(comm, rsVCARD);
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


function del(comm)
{
    log.debug("addressbook.delete called");

    comm.setHeader("Content-Type", "text/html");
    comm.setHeader("Server", "Fennel");

    // TODO: actually no. respond according to delete status or error while trying to delete
    comm.setResponseCode(204);

    log.debug("URLAsArray: " + comm.getURLAsArray());
    log.debug("URLElementSize: " + comm.getUrlElementSize());

    var isRoot = true;

    // // if URL element size === 4, this is a call for the root URL of a user.
    // // TODO: check if the current user is the user requesting the resource (ACL)
    if(comm.getUrlElementSize() > 4)
    {
        var lastPathElement = comm.getFilenameFromPath(false);
        if(comm.stringEndsWith(lastPathElement, '.vcf'))
        {
            isRoot = false;
        }
    }

    if(isRoot === true)
    {
        var addressbookId = comm.getPathElement(3);

        ADB.find({ where: {pkey: addressbookId} }).then(function(adb)
        {
            if(adb === null)
            {
                log.warn('err: could not find addressbook with ID: ' + addressbookId);
            }
            else
            {
                adb.destroy().then(function()
                {
                    log.debug('addressbook deleted');
                })
            }

            comm.flushResponse();
        });
    }
    else
    {
        var vcardId = comm.getFilenameFromPath(true);

        VCARD.find( { where: {pkey: vcardId}}).then(function(vcard)
        {
            if(vcard === null)
            {
                log.warn('err: could not find vcard: ' + vcardId);
            }
            else
            {
                vcard.destroy().then(function()
                {
                    log.debug('vcard deleted');
                })
            }

            comm.flushResponse();
        });
    }
}

function gett(comm)
{
    log.debug("calendar.get called");

    var res = comm.getRes();
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");

    var vcardId = comm.getFilenameFromPath(true);
    VCARD.find({ where: {pkey: vcardId} }).then(function(vcard)
    {
        if(vcard === null)
        {
            log.warn('err: could not find vcard');
        }
        else
        {
            var res = comm.getRes();

            var content = vcard.content;
            //content = content.replace(/\r\n|\r|\n/g,'&#13;\r\n');

            comm.appendResBody(content);
        }

        comm.flushResponse();
    });
}

function put(comm)
{
    // PUT /addressbooks/a3298271331/fruux-merged/68a386ea-be30-4922-a407-890b56bf944d.vcf HTTP/1.1
    // X-ADDRESSBOOKSERVER-KIND:group -> is_group === true

    log.debug("addressbook.put called");

    var vcardId = comm.getFilenameFromPath(true);

    var body = comm.getReqBody();

    var match = body.search(/X-ADDRESSBOOKSERVER-KIND:group/);
    var isGroup = (match >= 0);

    var username = comm.getUser().getUserName();

    var adbName = comm.getCardIdFromURL();

    // check out if we already have a record for the default addressbook
    // if not, lets create it, otherwise let's return its values...
    ADB.find({ where: {ownerId: username, name: adbName} }).then(function(adb)
    {
        var defaults = {
            addressbookId: adb.pkey,
            content: body,
            ownerId: comm.getUser().getUserName(),
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
                    vcard.content = comm.getReqBody();
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

    comm.setStandardHeaders();

    var date = new Date();
    comm.setHeader("ETag", Number(date));

    comm.setResponseCode(201);
    comm.flushResponse();
}

function move(comm)
{

    log.debug("calendar.move called");
/*
    comm.setStandardHeaders(comm);

    var ics_id = comm.getFilenameFromPath(true);
    var calendar = comm.getLastPathElement();

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

function options(comm)
{
    log.debug("principal.options called");

    comm.pushOptionsResponse();
}

function report(comm)
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

    comm.setStandardHeaders();

    comm.setResponseCode(200);
    comm.appendResBody(xh.getXMLHead());

    var body = comm.getReqBody();
    var xmlDoc = xml.parseXml(body);

    var rootNode = xmlDoc.root();

    var name = rootNode.name();
    switch(name)
    {
        case 'addressbook-multiget':
            handleReportAdressbookMultiget(comm);
            break;

        default:
            if(name != 'text') log.warn("P-R: not handled: " + name);
            comm.flushResponse();
            break;
    }
}

function handleReportAdressbookMultiget(comm)
{
    var body = comm.getReqBody();
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

        handleReportHrefs(comm, arrHrefs);
    }
    else
    {
        comm.flushResponse();
    }
}

function parseHrefToVCARDId(href)
{
    var e = href.split("/");
    var id = e[e.length - 1];

    return id.substr(0, id.length - 4);
}

function handleReportHrefs(comm, arrVCARDIds)
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
            response += "<d:href>" + comm.getURL() + vcard.pkey + ".vcf</d:href>";
            response += "<d:propstat><d:prop>";
            response += "<card:address-data>" + content + "</card:address-data>";
            response += "<d:getetag>\"" + Number(date) + "\"</d:getetag>";
            response += "</d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>";
            response += "</d:response>";
        }

        comm.appendResBody("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\" >\r\n");
        comm.appendResBody(response);
        comm.appendResBody("</d:multistatus>\r\n");

        comm.flushResponse();
    });
}

function proppatch(comm)
{
    log.debug("addressbook.proppatch called");

    /*
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
        var calendarId = comm.getLastPathElement(false);
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
    */
}