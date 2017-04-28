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

test('Calling REPORT on principal', function (t) {

    t.plan(1);

    var options = {
        method: 'REPORT',
        uri: "http://" + config.ip + ":" + config.port + "/p/",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        headers: [
            {
                name: 'content-type',
                value: 'application/xml; charset=utf-8'
            }
        ],
        body: "<?xml version='1.0' encoding='utf-8' ?><D:principal-search-property-set xmlns:D='DAV:'/>",
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error) {
            t.equal(response.statusCode, 200, "StatusCode matches");
            console.log(body);
            //t.equal(response.headers.location, "/p/", "Redirection matches");
        }
        else {
            t.fail();
        }
    });
});
