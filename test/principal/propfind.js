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
 ** under the terms of the GNU General Public License as published by the Free
 ** Software Foundation, either version 3 of the License, or (at your option)
 ** any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 ** more details.
 **
 ** You should have received a copy of the GNU General Public License along
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

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling PROPFIND on principal user', function (t) {

    t.plan(1);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:propfind xmlns:A=\"DAV:\">\n\r";
    payload += "<A:prop>\n\r";
    payload += "<D:addressbook-home-set xmlns:D=\"urn:ietf:params:xml:ns:carddav\"/>\n\r";
    payload += "<D:directory-gateway xmlns:D=\"urn:ietf:params:xml:ns:carddav\"/>\n\r";
    payload += "<A:displayname/>\n\r";
    payload += "<B:calendar-user-address-set xmlns:B=\"urn:ietf:params:xml:ns:caldav\"/>\n\r";
    payload += "<C:email-address-set xmlns:C=\"http://calendarserver.org/ns/\"/>\n\r";
    payload += "<A:principal-collection-set/>\n\r";
    payload += "<A:principal-URL/>\n\r";
    payload += "<A:resource-id/>\n\r";
    payload += "<A:supported-report-set/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:propfind>\n\r";

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
            //t.equal(response.headers.allow, "OPTIONS, PROPFIND, HEAD, GET, REPORT, PROPPATCH, PUT, DELETE, POST, COPY, MOVE", "Options match");
            console.log(body);
        }
        else {
            t.fail();
        }
    });
});

/*
 PROPFIND /principals/uid/_userid_/ HTTP/1.1

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
query: /principals/uid/_userid_/
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
<d:href>/principals/uid/_userid_/</d:href>
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