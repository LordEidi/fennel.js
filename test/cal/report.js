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
var xml = require("libxmljs");

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling REPORT on calendar', function (t) {

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";

    payload += "<A:sync-collection xmlns:A=\"DAV:\">\n\r";
    payload += "<A:sync-token>http://sabre.io/ns/sync/20</A:sync-token>\n\r";
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

    /*
    * expected response
    *
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

    request(options, function (error, response, body) {

        if (!error)
        {
            t.plan(3);

            t.equal(response.statusCode, 207, "StatusCode matches");

            var xmlDoc = xml.parseXml(body);

            var nodeSync = xmlDoc.get('/D:multistatus/D:sync-token', {   D: 'DAV:' } );

            t.doesNotEqual(nodeSync, undefined, "sync-token node exists");
            t.equal(nodeSync.text().substr(0, 29), "http://swordlord.org/ns/sync/", "sync token has right URL");

            var nodeStatus = xmlDoc.get('/D:multistatus', {   D: 'DAV:' } );

            var childs = nodeStatus.childNodes();
            for (var i=0; i < childs.length; ++i)
            {
                var child = childs[i];
                var name = child.name();

                // todo: Check body for correct amount of xml tags and entities
            }

            console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});
