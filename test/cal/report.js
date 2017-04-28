/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2016 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 ** This file is part of the test suite
 **
 ** This program is free software; you can redistribute it and/or modify it
 ** under the terms of the GNU Affero General Public License as published by the Free
 ** Software Foundation, either version 3 of the License, or (at your option)
 ** any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for
 ** more details.
 **
 ** You should have received a copy of the GNU Affero General Public License along
 ** with this program. If not, see <http://www.gnu.org/licenses/>.
 **
 **-----------------------------------------------------------------------------
 **
 ** Original Authors:
 ** LordEidi@swordlord.com
 ** LordLightningBolt@swordlord.com
 **
 ** $Id:
 **
 -----------------------------------------------------------------------------*/
var test = require('tape');
var request = require('request');
var xml = require("libxmljs");
var moment = require('moment');

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

// will be filled by a report query before use
var ics_file = "";

test('Calling REPORT synctoken on calendar', function (t) {

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";

    payload += "<A:sync-collection xmlns:A=\"DAV:\">\n\r";
    payload += "<A:sync-token>http://www.swordlord.org/ns/sync/20</A:sync-token>\n\r";
    payload += "<A:sync-level>1</A:sync-level>\n\r";
    payload += "<A:prop>\n\r";
    payload += "<A:getetag/>\n\r";
    payload += "<A:getcontenttype/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:sync-collection>\n\r";

    var options = {
        method: 'REPORT',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error)
        {
            t.plan(3);

            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeSync = xmlDoc.get('/D:multistatus/D:sync-token', {   D: 'DAV:' } );

            t.doesNotEqual(nodeSync, undefined, "sync-token node exists");
            t.equal(nodeSync.text().substr(0, 29), "http://swordlord.org/ns/sync/", "sync token has right URL");

            /*
             QUERY
             <?xml version='1.0' encoding='UTF-8'?>
             <A:sync-collection xmlns:A="DAV:">
             <A:sync-token>http://swordlord.com/ns/sync/20</A:sync-token>
             <A:sync-level>1</A:sync-level>
             <A:prop>
             <A:getcontenttype/>
             <A:getetag/>
             </A:prop>
             </A:sync-collection>

             RESPONSE
             <d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:fx="http://fruux.com/ns"
             xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
             <d:sync-token>http://swordlord.com/ns/sync/20</d:sync-token>
             </d:multistatus>

             * */

            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling REPORT comp-filter on calendar WITHOUT data, changeset with etags only', function (t) {

    var now = moment();

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";

    payload += "<B:calendar-query xmlns:B=\"urn:ietf:params:xml:ns:caldav\">\n\r";
    payload += "<A:prop xmlns:A=\"DAV:\">\n\r";
    payload += "    <A:getetag/>\n\r";
    payload += "    <A:getcontenttype/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "<B:filter>\n\r";
    payload += "<B:comp-filter name=\"VCALENDAR\">\n\r";
    payload += "    <B:comp-filter name=\"VEVENT\">\n\r";
    payload += "    <B:time-range start=\"" + now.subtract(1, "h").format("YMMDD[T]HH0000[Z]") + "\"/>\n\r";
    payload += "    </B:comp-filter>\n\r";
    payload += "</B:comp-filter>\n\r";
    payload += "</B:filter>\n\r";
    payload += "</B:calendar-query>\n\r";

    var options = {
        method: 'REPORT',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error)
        {
            t.plan(3);

            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );
            t.doesNotEqual(nodeHref, undefined, "href node exists");

            // store for a later test case
            ics_file = nodeHref.text();

            t.ok(nodeHref.text().match(/^\/cal\/[a-z0-9]+\/2A2AF854-18A0-47CB-870A-D94CA2341BAA\/[A-Z0-9_-]+\.ics$/g), "href has right URL");

            /*

             QUERY
             * <?xml version='1.0' encoding='UTF-8'?>
             <B:calendar-query xmlns:B="urn:ietf:params:xml:ns:caldav">
             <A:prop xmlns:A="DAV:">
             <A:getetag/>
             <B:calendar-data/> -> we want the calendar data as well!
             <A:getcontenttype/>
             </A:prop>
             <B:filter>
             <B:comp-filter name="VCALENDAR">
             <B:comp-filter name="VEVENT">
             <B:time-range start="20160911T000000Z"/>
             </B:comp-filter>
             </B:comp-filter>
             </B:filter>
             </B:calendar-query>

             RESPONSE
             *<?xml version='1.0' encoding='UTF-8'?>
             <d:multistatus
             xmlns:d="DAV:"
             xmlns:cal="urn:ietf:params:xml:ns:caldav"
             xmlns:cs="http://calendarserver.org/ns/"
             xmlns:card="urn:ietf:params:xml:ns:carddav"
             xmlns:ical="http://apple.com/ns/ical/">
             <d:response>
             <d:href>/cal/username/calid/event.ics</d:href>
             <d:propstat>
             <d:prop>
             <d:getetag>"etag"</d:getetag>
             <d:getcontenttype>text/calendar; charset=utf-8; component=VEVENT</d:getcontenttype>
             </d:prop>
             <d:status>HTTP/1.1 200 OK</d:status>
             </d:propstat>
             </d:response>
             <d:response>
             ...
             </d:response>
             <d:sync-token>http://swordlord.org/ns/sync/id</d:sync-token>
             </d:multistatus>

             * */

            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

// TODO: finish testcase
test('Calling REPORT comp-filter on calendar WITH data, full calendar-data', function (t) {

    var now = moment();

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";

    payload += "<B:calendar-query xmlns:B=\"urn:ietf:params:xml:ns:caldav\">\n\r";
    payload += "<A:prop xmlns:A=\"DAV:\">\n\r";
    payload += "    <A:getetag/>\n\r";
    payload += "    <B:calendar-data/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "<B:filter>\n\r";
    payload += "<B:comp-filter name=\"VCALENDAR\">\n\r";
    payload += "    <B:comp-filter name=\"VEVENT\">\n\r";
    payload += "    <B:time-range start=\"" + now.subtract(1, "h").format("YMMDD[T]HH0000[Z]") + "\"/>\n\r";
    payload += "    </B:comp-filter>\n\r";
    payload += "</B:comp-filter>\n\r";
    payload += "</B:filter>\n\r";
    payload += "</B:calendar-query>\n\r";

    var options = {
        method: 'REPORT',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error)
        {
            t.plan(3);

            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );
            t.doesNotEqual(nodeHref, undefined, "href node exists");

            // store for a later test case
            ics_file = nodeHref.text();

            t.ok(nodeHref.text().match(/^\/cal\/[a-z0-9]+\/2A2AF854-18A0-47CB-870A-D94CA2341BAA\/[A-Z0-9_-]+\.ics$/g), "href has right URL");

            t.comment("++ TODO: Check for full ICS data is missing");
            // TODO: Check for full ICS data...
            /*

             QUERY
             * <?xml version='1.0' encoding='UTF-8'?>
             <B:calendar-query xmlns:B="urn:ietf:params:xml:ns:caldav">
             <A:prop xmlns:A="DAV:">
             <A:getetag/>
             <B:calendar-data/> -> we want the calendar data as well!
             <A:getcontenttype/>
             </A:prop>
             <B:filter>
             <B:comp-filter name="VCALENDAR">
             <B:comp-filter name="VEVENT">
             <B:time-range start="20160911T000000Z"/>
             </B:comp-filter>
             </B:comp-filter>
             </B:filter>
             </B:calendar-query>

             RESPONSE
             *<?xml version='1.0' encoding='UTF-8'?>
             <d:multistatus
             xmlns:d="DAV:"
             xmlns:cal="urn:ietf:params:xml:ns:caldav"
             xmlns:cs="http://calendarserver.org/ns/"
             xmlns:card="urn:ietf:params:xml:ns:carddav"
             xmlns:ical="http://apple.com/ns/ical/">
             <d:response>
             <d:href>/cal/username/calid/event.ics</d:href>
             <d:propstat>
             <d:prop>
             <d:getetag>"etag"</d:getetag>
             <d:getcontenttype>text/calendar; charset=utf-8; component=VEVENT</d:getcontenttype>
             </d:prop>
             <d:status>HTTP/1.1 200 OK</d:status>
             </d:propstat>
             </d:response>
             <d:response>
             ...
             </d:response>
             <d:sync-token>http://swordlord.org/ns/sync/id</d:sync-token>
             </d:multistatus>

             * */

            console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

// todo: get request for one item
test('Calling GET ICS on calendar', function (t) {

    var options = {
        method: 'GET',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA/" + ics_file,
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error)
        {
            t.plan(1);

            t.equal(response.statusCode, 200, "StatusCode matches");

            console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});
