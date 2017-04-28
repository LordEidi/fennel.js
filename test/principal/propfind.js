/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2015-16 by
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

test('Calling PROPFIND on principal user', function (t) {

    t.plan(9);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\r\n";
    payload += "<A:propfind xmlns:A=\"DAV:\">\r\n";
    payload += "<A:prop>\r\n";
    payload += "<D:addressbook-home-set xmlns:D=\"urn:ietf:params:xml:ns:carddav\"/>\r\n";
    payload += "<D:directory-gateway xmlns:D=\"urn:ietf:params:xml:ns:carddav\"/>\r\n";
    payload += "<A:displayname/>\r\n";
    payload += "<B:calendar-user-address-set xmlns:B=\"urn:ietf:params:xml:ns:caldav\"/>\r\n";
    payload += "<C:email-address-set xmlns:C=\"http://calendarserver.org/ns/\"/>\r\n";
    payload += "<A:principal-collection-set/>\r\n";
    payload += "<A:principal-URL/>\r\n";
    payload += "<A:resource-id/>\r\n";
    payload += "<A:supported-report-set/>\r\n";
    payload += "</A:prop>\r\n";
    payload += "</A:propfind>\r\n";

    var options = {
        method: 'PROPFIND',
        uri: "http://" + config.ip + ":" + config.port + "/p/" + username + "/",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error) {
            t.equal(response.statusCode, 207, "StatusCode matches");

            console.log(response.headers);
            t.equal(response.headers.dav, '1, 3, extended-mkcol, calendar-access, calendar-schedule, calendar-proxy, calendarserver-sharing, calendarserver-subscribed, addressbook, access-control, calendarserver-principal-property-search', "DAV header matches");

            var xmlDoc = xml.parseXml(body);

            var nodeHref = xmlDoc.get('/D:multistatus/D:response/D:href', {   D: 'DAV:' } );
            t.doesNotEqual(nodeHref, undefined, "href node exists");

            t.ok(nodeHref.text().match(/^\/p\/[a-z0-9]+\/$/g), "href has right URL");

            var nodeStatusCode = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:status', {   D: 'DAV:' } );
            t.doesNotEqual(nodeStatusCode, undefined, "status node exists");

            t.ok(nodeStatusCode.text().match(/^HTTP\/1.1 200 OK/g), "statuscode node has right text");

            var nodeCalUserAddSet = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/CAL:calendar-user-address-set', {   D: 'DAV:', CAL: 'urn:ietf:params:xml:ns:caldav' } );
            t.doesNotEqual(nodeCalUserAddSet, undefined, "calendar-user-address-set node exists");

            var nodeCardABHomeSet = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/CARD:addressbook-home-set', {   D: 'DAV:', CARD: 'urn:ietf:params:xml:ns:carddav' } );
            t.doesNotEqual(nodeCardABHomeSet, undefined, "card_addressbook_home_set node exists");

            var nodeDisplayName = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/D:displayname', {   D: 'DAV:' } );
            t.doesNotEqual(nodeDisplayName, undefined, "displayname node exists");

            //var nodeEmail = xmlDoc.get('/D:multistatus/D:response/D:propstat/D:prop/CS:email-address-set', {   D: 'DAV:', CS: 'http://calendarserver.org/ns' } );
            //t.doesNotEqual(nodeEmail, undefined, "email-address node exists");

            //console.log(body);
        }
        else {
            t.fail();
        }
    });
});

/*
 PROPFIND /p/_userid_/ HTTP/1.1

 <?xml version="1.0" encoding="UTF-8"?>
 <A:propfind xmlns:A="DAV:">
 <A:prop>
 <D:addressbook-home-set xmlns:D="urn:ietf:params:xml:ns:carddav"/>
 <D:directory-gateway xmlns:D="urn:ietf:params:xml:ns:carddav"/>
 <A:displayname/>
 <C:email-address-set xmlns:C="http://calendarserver.org/ns/"/>
 <A:principal-collection-set/>
 <A:principal-URL/>
 <A:resource-id/>
 <A:supported-report-set/>
 </A:prop>
 </A:propfind>
 */

/*
*
* /PRINCIPAL/ID
*
query: /p/_userid_/
<?xml version="1.0" encoding="UTF-8"?>
<A:propfind xmlns:A="DAV:">
    <A:prop>
<B:calendar-user-address-set xmlns:B="urn:ietf:params:xml:ns:caldav"/>
    <A:displayname/>
<C:email-address-set xmlns:C="http://calendarserver.org/ns/"/>
    </A:prop>
</A:propfind>

ret
<d:multistatus xmlns:d="DAV:" xmlns:s="http://sabredav.org/ns" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/" xmlns:card="urn:ietf:params:xml:ns:carddav">
    <d:response>
<d:href>/p/_userid_/</d:href>
<d:propstat>
<d:prop>
<cal:calendar-user-address-set>
<d:href>mailto:email</d:href>
<d:href>/principals/uid/_userid_/</d:href>
</cal:calendar-user-address-set>
<d:displayname>user name</d:displayname>
<cs:email-address-set>
<cs:email-address>email</cs:email-address>
</cs:email-address-set>
</d:prop>
<d:status>HTTP/1.1 200 OK</d:status>
</d:propstat>
</d:response>
</d:multistatus>

*/