/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2015 by
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

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling REPORT on cards', function (t) {

    t.plan(1);

    var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
    payload += "<A:sync-collection xmlns:A='DAV:'>\n\r";
    payload += "<A:sync-token>http://sabredav.org/ns/sync/14</A:sync-token>\n\r";
    payload += "<A:sync-level>1</A:sync-level>\n\r";
    payload += "<A:prop>\n\r";
    payload += "<A:getetag/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "</A:sync-collection>\n\r";

        /*
    REPORT /addressbooks/a3298271331/8ec6424c-ede3-4a55-8613-e760df985cac/ HTTP/1.1

    var payload = "<?xml version="1.0" encoding="UTF-8"?>\n\r";
    payload += "<D:addressbook-multiget xmlns:D="urn:ietf:params:xml:ns:carddav">\n\r";
    payload += "<A:prop xmlns:A="DAV:">\n\r";
    payload += "<A:getetag/>\n\r";
    payload += "<D:address-data/>\n\r";
    payload += "</A:prop>\n\r";
    payload += "<A:href xmlns:A="DAV:">/addressbooks/a3298271331/8ec6424c-ede3-4a55-8613-e760df985cac/973d3ed8-9ef6-4724-a04a-b73748829d15.vcf</A:href>
    payload += "</D:addressbook-multiget>\n\r";
    */

    var options = {
        method: 'REPORT',
        uri: "http://" + config.ip + ":" + config.port + "/card/" + username + "/default/",
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
            t.equal(response.statusCode, 200, "StatusCode matches");
            console.log(body);
        }
        else {
            t.fail(error);
        }
    });
});
