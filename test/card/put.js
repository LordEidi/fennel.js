/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2015-17 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 ** This file is part of the test suite
 **
 ** This program is free software; you can redistribute it and/or modify it
 ** under the terms of the GNU Affero General Public License as published by the
 ** Free Software Foundation, either version 3 of the License, or (at your
 ** option) any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for
 ** more details.
 **
 ** You should have received a copy of the GNU Affero General Public License
 ** along with this program. If not, see <http://www.gnu.org/licenses/>.
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

test('Calling PUT on cards', function (t) {

    t.plan(1);

    var payload = "BEGIN:VCARD\n\r";
    payload += "VERSION:3.0\n\r";
    payload += "PRODID:-//Apple Inc.//iOS 9.0.2//EN\n\r";
    payload += "N:Www;Www;;;\n\r";
    payload += "FN:Www Www\n\r";
    payload += "ORG:company;\n\r";
    payload += "REV:2015-10-16T13:00:28Z\n\r";
    payload += "UID:E2D83EA7-9DA7-46F9-93EC-70F73BB1E4D1\n\r";
    payload += "END:VCARD\n\r";

    var options = {
        method: 'PUT',
        uri: "http://" + config.ip + ":" + config.port + "/card/" + username + "/default/7997A784-375D-4B42-8FAE-A9EAA3FB0DBF.vcf",
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
            t.equal(response.statusCode, 201, "StatusCode matches");
        }
        else {
            t.fail(error);
        }
    });
});
