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
var moment = require('moment');
var uuid = require('uuid');

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling PUT on calendar', function (t) {

    t.plan(2);

    var now = moment();
    var uuidEvent = uuid.v4();

    var payload = "BEGIN:VCALENDAR\r\n";
    payload += "CALSCALE:GREGORIAN.\r\n";
    payload += "PRODID:-//SwordLord - the coding crew.//" + config.version_nr + "//EN.\r\n";
    payload += "VERSION:2.0.\r\n";
    payload += "BEGIN:VTIMEZONE.\r\n";
    payload += "TZID:Europe/Zurich.\r\n";
    payload += "BEGIN:DAYLIGHT.\r\n";
    payload += "DTSTART:19810329T020000.\r\n";
    payload += "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU.\r\n";
    payload += "TZNAME:GMT+2.\r\n";
    payload += "TZOFFSETFROM:+0100.\r\n";
    payload += "TZOFFSETTO:+0200.\r\n";
    payload += "END:DAYLIGHT.\r\n";
    payload += "BEGIN:STANDARD.\r\n";
    payload += "DTSTART:19961027T030000.\r\n";
    payload += "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU.\r\n";
    payload += "TZNAME:GMT+1.\r\n";
    payload += "TZOFFSETFROM:+0200.\r\n";
    payload += "TZOFFSETTO:+0100.\r\n";
    payload += "END:STANDARD.\r\n";
    payload += "END:VTIMEZONE.\r\n";
    payload += "BEGIN:VEVENT.\r\n";
    payload += "CREATED:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\r\n";
    payload += "LAST-MODIFIED:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\r\n";
    payload += "DTSTAMP:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\r\n";
    payload += "DTSTART;TZID=Europe/Zurich:" + now.add(1, "h").format("YMMDD[T]HH0000[Z]") + ".\r\n";
    payload += "DTEND;TZID=Europe/Zurich:" + now.add(1, "h").format("YMMDD[T]HH0000[Z]") + ".\r\n";
    payload += "SEQUENCE:0.\r\n";
    payload += "SUMMARY:Demo Event " + now.format("x") + ".\r\n";
    payload += "TRANSP:OPAQUE.\r\n";
    payload += "UID:" + uuidEvent + ".\r\n";
    payload += "END:VEVENT.\r\n";
    payload += "END:VCALENDAR.\r\n";

    var options = {
        method: 'PUT',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA/" + uuidEvent + ".icf",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        headers: {
            'If-None-Match': '*'
        },
        followRedirect: false
    }

    request(options, function (error, response, body) {

        if (!error) {
            t.equal(response.statusCode, 201, "StatusCode matches");
            // Check ETAG Header

            // resend, should send status 412 now, existing record should not be overwritten
            request(options, function (error, response, body) {

                if (!error) {
                    t.equal(response.statusCode, 412, "StatusCode matches");
                    // Check ETAG Header
                }
                else {
                    t.fail(error);
                }
            });
        }
        else {
            t.fail(error);
        }
    });
});
