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

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling PROPFIND getctag and synctoken on calendar with existent ID', function (t) {

    t.plan(5);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<C:getctag xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "<A:sync-token/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");
            // todo: Check body for correct amount of xml tags and entities

            var xmlDoc = xml.parseXml(body);

            var nodegetctag = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/CS:getctag', {   D: 'DAV:', CS: 'http://calendarserver.org/ns/' } );
            t.doesNotEqual(nodegetctag, undefined, "getctag node exists");

            var nodeSynctoken = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/D:sync-token', {   D: 'DAV:' } );
            t.doesNotEqual(nodeSynctoken, undefined, "synctoken node exists");

            var nodeStatusCode = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:status', {   D: 'DAV:' } );
            t.doesNotEqual(nodeStatusCode, undefined, "status node exists");

            t.ok(nodeStatusCode.text().match(/^HTTP\/1.1 200 OK/g), "statuscode node has right text");

            /*
            *   * request to the specified calendar and getctag, sync token
             <A:propfind xmlns:A="DAV:">
             <A:prop>
             <C:getctag xmlns:C="http://calendarserver.org/ns/"/>
             <A:sync-token/>
             </A:prop>
             </A:propfind>


             <d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">

             <d:response>
             <d:href>/cal/user/calid/</d:href>
             <d:propstat>
             <d:prop>
             <cs:getctag>http://swordlord.org/ns/sync/3</cs:getctag>
             <d:sync-token>http://swordlord.org/ns/sync/3</d:sync-token>
             </d:prop>
             <d:status>HTTP/1.1 200 OK</d:status>
             </d:propstat>
             </d:response>

             </d:multistatus>

            *
            * */


            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling PROPFIND getctag and synctoken on calendar with NON existent ID', function (t) {

    t.plan(3);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<C:getctag xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "<A:sync-token/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/DOES-NOT-EXIST/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeStatusCode = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:status', {   D: 'DAV:' } );
            t.doesNotEqual(nodeStatusCode, undefined, "status node exists");

            t.ok(nodeStatusCode.text().match(/^HTTP\/1.1 404/g), "statuscode node has right text");

            /*
             *   * request to the specified calendar and getctag, sync token
             <A:propfind xmlns:A="DAV:">
             <A:prop>
             <C:getctag xmlns:C="http://calendarserver.org/ns/"/>
             <A:sync-token/>
             </A:prop>
             </A:propfind>


             <d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
             <d:response>
             <d:href>/cal/user/calid/</d:href>
             <d:propstat>
             <d:status>HTTP/1.1 404 NOT FOUND</d:status>
             </d:propstat>
             </d:response>

             </d:multistatus>

             *
             * */


            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling PROPFIND getctag and synctoken on calendar inbox', function (t) {

    t.plan(2);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<C:getctag xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "<A:sync-token/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/inbox/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");
            // todo: Check body for correct amount of xml tags and entities

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );

            t.doesNotEqual(nodeHref, undefined, "href node exists");
            /*
             *   * request to the inbox and getctag, sync token
             <A:propfind xmlns:A="DAV:">
             <A:prop>
             <C:getctag xmlns:C="http://calendarserver.org/ns/"/>
             <A:sync-token/>
             </A:prop>
             </A:propfind>

             * <d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
             <d:response>
             <d:href>/calendars/_userid_/notifications/</d:href>
             </d:response>
             </d:multistatus>
             *
             * */


            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling PROPFIND getctag and synctoken on calendar notifications', function (t) {

    t.plan(2);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<C:getctag xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "<A:sync-token/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/notifications/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");
            // todo: Check body for correct amount of xml tags and entities

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );

            t.doesNotEqual(nodeHref, undefined, "href node exists");
            /*
             *   * request to the inbox and getctag, sync token
             <A:propfind xmlns:A="DAV:">
             <A:prop>
             <C:getctag xmlns:C="http://calendarserver.org/ns/"/>
             <A:sync-token/>
             </A:prop>
             </A:propfind>

             * <d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
             <d:response>
             <d:href>/calendars/_userid_/notifications/</d:href>
             </d:response>
             </d:multistatus>
             *
             * */


            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling PROPFIND getetag and notificationtype on calendar notifications', function (t) {

    t.plan(5);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<A:getetag/>\n\r";
    payload += "<C:C:notificationtype xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/notifications/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );
            t.doesNotEqual(nodeHref, undefined, "href node exists");

            t.ok(nodeHref.text().match(/^\/cal\/[a-z0-9]+\/notifications\/$/g), "href has right URL");

            var nodeStatusCode = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:status', {   D: 'DAV:' } );
            t.doesNotEqual(nodeStatusCode, undefined, "status node exists");

            t.ok(nodeStatusCode.text().match(/^HTTP\/1.1 200 OK/g), "statuscode node has right text");

            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});

test('Calling PROPFIND getetag and contenttype on calendar inbox', function (t) {

    // and then the call for inbox and content type, calendar.js -> line 364 ff

    t.plan(5);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<A:getetag/>\n\r";
    payload += "<A:getcontenttype/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/inbox/",
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
            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );
            t.doesNotEqual(nodeHref, undefined, "href node exists");

            t.ok(nodeHref.text().match(/^\/cal\/[a-z0-9]+\/inbox\/$/g), "href has right URL");

            var nodeStatusCode = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:status', {   D: 'DAV:' } );
            t.doesNotEqual(nodeStatusCode, undefined, "status node exists");

            t.ok(nodeStatusCode.text().match(/^HTTP\/1.1 200 OK/g), "statuscode node has right text");

            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });

});


/*

 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 *
 * cal/USER/CALENDAR_ID
 *
 * ************************************************************************************************************************************************************************************

query
<A:propfind xmlns:A="DAV:">
    <A:prop>
<C:getctag xmlns:C="http://calendarserver.org/ns/"/>
    <A:sync-token/>
</A:prop>
</A:propfind>

ret
<d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">

 <d:response>
 <d:href>/cal/user/calid/</d:href>
 <d:propstat>
 <d:prop>
 <cs:getctag>http://swordlord.org/ns/sync/3</cs:getctag>
 <d:sync-token>http://swordlord.org/ns/sync/3</d:sync-token>
 </d:prop>
 <d:status>HTTP/1.1 200 OK</d:status>
 </d:propstat>
 </d:response>

 </d:multistatus>

 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 *
 * cal/USER/notifications
 *
 * ************************************************************************************************************************************************************************************

Query
<A:propfind xmlns:A="DAV:">
    <A:prop>
<C:getctag xmlns:C="http://calendarserver.org/ns/"/>
    <A:sync-token/>
</A:prop>
</A:propfind>

ret
<d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
    <d:response>
<d:href>/calendars/_userid_/notifications/</d:href>
</d:response>
</d:multistatus>


 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 * ************************************************************************************************************************************************************************************
 *
 * cal/USER/inbox
 *
 * ************************************************************************************************************************************************************************************

Query
<A:propfind xmlns:A="DAV:">
    <A:prop>
<C:getctag xmlns:C="http://calendarserver.org/ns/"/>
    <A:sync-token/>
</A:prop>
</A:propfind>

ret
<d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
    <d:response>
<d:href>/calendars/_userid_/inbox/</d:href>
</d:response>
</d:multistatus>

* ************************************************************************************************************************************************************************************
* ************************************************************************************************************************************************************************************
* ************************************************************************************************************************************************************************************
*
* cal/USER
*
* ************************************************************************************************************************************************************************************
*
Query
<A:propfind xmlns:A="DAV:">
    <A:prop>
<A:add-member/>
<C:allowed-sharing-modes xmlns:C="http://calendarserver.org/ns/"/>
    <D:autoprovisioned xmlns:D="http://apple.com/ns/ical/"/>
    <E:bulk-requests xmlns:E="http://me.com/_namespace/"/>
    <B:calendar-alarm xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <D:calendar-color xmlns:D="http://apple.com/ns/ical/"/>
    <B:calendar-description xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <B:calendar-free-busy-set xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <D:calendar-order xmlns:D="http://apple.com/ns/ical/"/>
    <B:calendar-timezone xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <A:current-user-privilege-set/>
<B:default-alarm-vevent-date xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <B:default-alarm-vevent-datetime xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <A:displayname/>
<C:getctag xmlns:C="http://calendarserver.org/ns/"/>
    <C:invite xmlns:C="http://calendarserver.org/ns/"/>
    <D:language-code xmlns:D="http://apple.com/ns/ical/"/>
    <D:location-code xmlns:D="http://apple.com/ns/ical/"/>
    <A:owner/>
<C:pre-publish-url xmlns:C="http://calendarserver.org/ns/"/>
    <C:publish-url xmlns:C="http://calendarserver.org/ns/"/>
    <C:push-transports xmlns:C="http://calendarserver.org/ns/"/>
    <C:pushkey xmlns:C="http://calendarserver.org/ns/"/>
    <A:quota-available-bytes/>
<A:quota-used-bytes/>
<D:refreshrate xmlns:D="http://apple.com/ns/ical/"/>
    <A:resource-id/>
<A:resourcetype/>
<B:schedule-calendar-transp xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <B:schedule-default-calendar-URL xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <C:source xmlns:C="http://calendarserver.org/ns/"/>
    <C:subscribed-strip-alarms xmlns:C="http://calendarserver.org/ns/"/>
    <C:subscribed-strip-attachments xmlns:C="http://calendarserver.org/ns/"/>
    <C:subscribed-strip-todos xmlns:C="http://calendarserver.org/ns/"/>
    <B:supported-calendar-component-set xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <B:supported-calendar-component-sets xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <A:supported-report-set/>
<A:sync-token/>
</A:prop>
</A:propfind>

ret
<d:multistatus xmlns:d="DAV:" xmlns:s="http://swordlord.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
    <d:response>
<d:href>/calendars/_userid_/</d:href>
<d:propstat>
<d:prop>
<d:current-user-privilege-set>
<d:privilege>
<d:write/>
</d:privilege>
<d:privilege>
<d:write-acl/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:write-content/>
</d:privilege>
<d:privilege>
<d:bind/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:unlock/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<cal:default-alarm-vevent-date>BEGIN:VALARM&#13;
X-WR-ALARMUID:3A9B1BC5-9505-4E9A-8387-2C440930C1FD&#13;
UID:3A9B1BC5-9505-4E9A-8387-2C440930C1FD&#13;
TRIGGER:-PT15H&#13;
ATTACH;VALUE=URI:Basso&#13;
ACTION:AUDIO&#13;
END:VALARM&#13;
</cal:default-alarm-vevent-date>
<cal:default-alarm-vevent-datetime>BEGIN:VALARM&#13;
X-WR-ALARMUID:UUID1&#13;
UID:UUID1&#13;
TRIGGER;VALUE=DATE-TIME:19760401T005545Z&#13;
ACTION:NONE&#13;
END:VALARM&#13;
</cal:default-alarm-vevent-datetime>
<d:owner>
<d:href>/p/_userid_/</d:href>
</d:owner>
<d:resourcetype>
<d:collection/>
</d:resourcetype>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:sync-collection/>
</d:report>
</d:supported-report>
</d:supported-report-set>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/calid/</d:href>
<d:propstat>
<d:prop>
<cs:allowed-sharing-modes>
<cs:can-be-shared/>
<cs:can-be-published/>
</cs:allowed-sharing-modes>
<x1:calendar-color xmlns:x1="http://apple.com/ns/ical/">#F64F00FF</x1:calendar-color>
<cal:calendar-description/>
<x1:calendar-order xmlns:x1="http://apple.com/ns/ical/">1</x1:calendar-order>
<cal:calendar-timezone>BEGIN:VCALENDAR&#13;
VERSION:2.0&#13;
PRODID:-//Apple Inc.//Mac OS X 10.9.1//EN&#13;
    CALSCALE:GREGORIAN&#13;
BEGIN:VTIMEZONE&#13;
TZID:Europe/Zurich&#13;
BEGIN:DAYLIGHT&#13;
TZOFFSETFROM:+0100&#13;
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU&#13;
DTSTART:19810329T020000&#13;
TZNAME:GMT+2&#13;
TZOFFSETTO:+0200&#13;
END:DAYLIGHT&#13;
BEGIN:STANDARD&#13;
TZOFFSETFROM:+0200&#13;
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU&#13;
DTSTART:19961027T030000&#13;
TZNAME:GMT+1&#13;
TZOFFSETTO:+0100&#13;
END:STANDARD&#13;
END:VTIMEZONE&#13;
END:VCALENDAR&#13;
</cal:calendar-timezone>
<d:current-user-privilege-set>
<d:privilege>
<d:write/>
</d:privilege>
<d:privilege>
<d:write-acl/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:write-content/>
</d:privilege>
<d:privilege>
<d:bind/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:unlock/>
</d:privilege>
<d:privilege>
<cal:read-free-busy/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<d:displayname>Tasks</d:displayname>
<cs:getctag>http://swordlord.org/ns/sync/5</cs:getctag>
<cs:invite/>
<d:owner>
<d:href>/p/_userid_/</d:href>
</d:owner>
<cs:pre-publish-url>
<d:href>https://domain/cal/_userid_/calid.ics</d:href>
</cs:pre-publish-url>
<d:resourcetype>
<d:collection/>
<cal:calendar/>
</d:resourcetype>
<cal:schedule-calendar-transp>
<cal:opaque/>
</cal:schedule-calendar-transp>
<cal:supported-calendar-component-set>
<cal:comp name="VTODO"/>
    </cal:supported-calendar-component-set>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-multiget/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:free-busy-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:sync-collection/>
</d:report>
</d:supported-report>
</d:supported-report-set>
<d:sync-token>http://swordlord.org/ns/sync/5</d:sync-token>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/calid/</d:href>
<d:propstat>
<d:prop>
<cs:allowed-sharing-modes>
<cs:can-be-shared/>
<cs:can-be-published/>
</cs:allowed-sharing-modes>
<x1:calendar-color xmlns:x1="http://apple.com/ns/ical/">#44A703FF</x1:calendar-color>
<cal:calendar-description/>
<x1:calendar-order xmlns:x1="http://apple.com/ns/ical/">2</x1:calendar-order>
<cal:calendar-timezone>BEGIN:VCALENDAR&#13;
VERSION:2.0&#13;
PRODID:-//Apple Inc.//Mac OS X 10.9.1//EN&#13;
    CALSCALE:GREGORIAN&#13;
BEGIN:VTIMEZONE&#13;
TZID:Europe/Zurich&#13;
BEGIN:DAYLIGHT&#13;
TZOFFSETFROM:+0100&#13;
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU&#13;
DTSTART:19810329T020000&#13;
TZNAME:GMT+2&#13;
TZOFFSETTO:+0200&#13;
END:DAYLIGHT&#13;
BEGIN:STANDARD&#13;
TZOFFSETFROM:+0200&#13;
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU&#13;
DTSTART:19961027T030000&#13;
TZNAME:GMT+1&#13;
TZOFFSETTO:+0100&#13;
END:STANDARD&#13;
END:VTIMEZONE&#13;
END:VCALENDAR&#13;
</cal:calendar-timezone>
<d:current-user-privilege-set>
<d:privilege>
<d:write/>
</d:privilege>
<d:privilege>
<d:write-acl/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:write-content/>
</d:privilege>
<d:privilege>
<d:bind/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:unlock/>
</d:privilege>
<d:privilege>
<cal:read-free-busy/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<d:displayname>Calendar</d:displayname>
<cs:getctag>http://swordlord.org/ns/sync/20</cs:getctag>
<cs:invite/>
<d:owner>
<d:href>/principals/uid/_userid_/</d:href>
</d:owner>
<cs:pre-publish-url>
<d:href>https://domain/cal/_userid_/calid.ics</d:href>
</cs:pre-publish-url>
<d:resourcetype>
<d:collection/>
<cal:calendar/>
</d:resourcetype>
<cal:schedule-calendar-transp>
<cal:opaque/>
</cal:schedule-calendar-transp>
<cal:supported-calendar-component-set>
<cal:comp name="VEVENT"/>
    </cal:supported-calendar-component-set>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-multiget/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:free-busy-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:sync-collection/>
</d:report>
</d:supported-report>
</d:supported-report-set>
<d:sync-token>http://swordlord.org/ns/sync/20</d:sync-token>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/calid/</d:href>
<d:propstat>
<d:prop>
<cs:allowed-sharing-modes>
<cs:can-be-shared/>
<cs:can-be-published/>
</cs:allowed-sharing-modes>
<x1:calendar-color xmlns:x1="http://apple.com/ns/ical/">#0E61B9FF</x1:calendar-color>
<cal:calendar-description/>
<x1:calendar-order xmlns:x1="http://apple.com/ns/ical/">3</x1:calendar-order>
<cal:calendar-timezone>BEGIN:VCALENDAR&#13;
VERSION:2.0&#13;
PRODID:-//Apple Inc.//Mac OS X 10.9.1//EN&#13;
    CALSCALE:GREGORIAN&#13;
BEGIN:VTIMEZONE&#13;
TZID:GMT&#13;
BEGIN:STANDARD&#13;
TZOFFSETFROM:+0000&#13;
DTSTART:20010101T000000&#13;
TZNAME:GMT&#13;
TZOFFSETTO:+0000&#13;
END:STANDARD&#13;
END:VTIMEZONE&#13;
END:VCALENDAR&#13;
</cal:calendar-timezone>
<d:current-user-privilege-set>
<d:privilege>
<d:write/>
</d:privilege>
<d:privilege>
<d:write-acl/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:write-content/>
</d:privilege>
<d:privilege>
<d:bind/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:unlock/>
</d:privilege>
<d:privilege>
<cal:read-free-busy/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<d:displayname>neues</d:displayname>
<cs:getctag>http://swordlord.org/ns/sync/20</cs:getctag>
<cs:invite/>
<d:owner>
<d:href>/principals/uid/_userid_/</d:href>
</d:owner>
<cs:pre-publish-url>
<d:href>https://domain/cal/_userid_/calitem.ics</d:href>
</cs:pre-publish-url>
<d:resourcetype>
<d:collection/>
<cal:calendar/>
</d:resourcetype>
<cal:schedule-calendar-transp>
<cal:opaque/>
</cal:schedule-calendar-transp>
<cal:supported-calendar-component-set>
<cal:comp name="VEVENT"/>
    </cal:supported-calendar-component-set>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-multiget/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:free-busy-query/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:sync-collection/>
</d:report>
</d:supported-report>
</d:supported-report-set>
<d:sync-token>http://swordlord.org/ns/sync/20</d:sync-token>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/outbox/</d:href>
<d:propstat>
<d:prop>
<d:current-user-privilege-set>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
<d:privilege>
<cal:schedule-post-vevent/>
</d:privilege>
<d:privilege>
<cal:schedule-query-freebusy/>
</d:privilege>
</d:current-user-privilege-set>
<d:owner>
<d:href>/p/_userid_/</d:href>
</d:owner>
<d:resourcetype>
<d:collection/>
<cal:schedule-outbox/>
</d:resourcetype>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
</d:supported-report-set>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/inbox/</d:href>
<d:propstat>
<d:prop>
<d:current-user-privilege-set>
<d:privilege>
<cal:schedule-deliver-reply/>
</d:privilege>
<d:privilege>
<cal:schedule-deliver-invite/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<d:owner>
<d:href>/p/_userid_/</d:href>
</d:owner>
<d:resourcetype>
<d:collection/>
<cal:schedule-inbox/>
</d:resourcetype>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-multiget/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<cal:calendar-query/>
</d:report>
</d:supported-report>
</d:supported-report-set>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
<d:response>
<d:href>/cal/_userid_/notifications/</d:href>
<d:propstat>
<d:prop>
<d:current-user-privilege-set>
<d:privilege>
<d:write/>
</d:privilege>
<d:privilege>
<d:write-acl/>
</d:privilege>
<d:privilege>
<d:write-properties/>
</d:privilege>
<d:privilege>
<d:write-content/>
</d:privilege>
<d:privilege>
<d:bind/>
</d:privilege>
<d:privilege>
<d:unbind/>
</d:privilege>
<d:privilege>
<d:unlock/>
</d:privilege>
<d:privilege>
<d:read/>
</d:privilege>
<d:privilege>
<d:read-acl/>
</d:privilege>
<d:privilege>
<d:read-current-user-privilege-set/>
</d:privilege>
</d:current-user-privilege-set>
<d:owner>
<d:href>/p/_userid_/</d:href>
</d:owner>
<d:resourcetype>
<d:collection/>
<cs:notification/>
</d:resourcetype>
<d:supported-report-set>
<d:supported-report>
<d:report>
<d:expand-property/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-property-search/>
</d:report>
</d:supported-report>
<d:supported-report>
<d:report>
<d:principal-search-property-set/>
</d:report>
</d:supported-report>
</d:supported-report-set>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
</d:multistatus>
*
* */