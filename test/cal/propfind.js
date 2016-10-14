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

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling PROPFIND on calendar', function (t) {

    t.plan(1);

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
            // Check body for correct amount of xml tags and entities
            console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});
