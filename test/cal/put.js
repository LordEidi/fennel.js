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
var moment = require('moment');
var uuid = require('uuid');

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

test('Calling PUT on calendar', function (t) {

    t.plan(2);

    var now = moment();
    var uuidEvent = uuid.v4();

    var payload = "BEGIN:VCALENDAR\n\r";
    payload += "CALSCALE:GREGORIAN.\n\r";
    payload += "PRODID:-//SwordLord - the coding crew.//" + config.version_nr + "//EN.\n\r";
    payload += "VERSION:2.0.\n\r";
    payload += "BEGIN:VTIMEZONE.\n\r";
    payload += "TZID:Europe/Zurich.\n\r";
    payload += "BEGIN:DAYLIGHT.\n\r";
    payload += "DTSTART:19810329T020000.\n\r";
    payload += "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU.\n\r";
    payload += "TZNAME:GMT+2.\n\r";
    payload += "TZOFFSETFROM:+0100.\n\r";
    payload += "TZOFFSETTO:+0200.\n\r";
    payload += "END:DAYLIGHT.\n\r";
    payload += "BEGIN:STANDARD.\n\r";
    payload += "DTSTART:19961027T030000.\n\r";
    payload += "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU.\n\r";
    payload += "TZNAME:GMT+1.\n\r";
    payload += "TZOFFSETFROM:+0200.\n\r";
    payload += "TZOFFSETTO:+0100.\n\r";
    payload += "END:STANDARD.\n\r";
    payload += "END:VTIMEZONE.\n\r";
    payload += "BEGIN:VEVENT.\n\r";
    payload += "CREATED:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\n\r";
    payload += "LAST-MODIFIED:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\n\r";
    payload += "DTSTAMP:" + now.format("YMMDD[T]HHmmSS[Z]") + ".\n\r";
    payload += "DTSTART;TZID=Europe/Zurich:" + now.add(1, "h").format("YMMDD[T]HH0000[Z]") + ".\n\r";
    payload += "DTEND;TZID=Europe/Zurich:" + now.add(1, "h").format("YMMDD[T]HH0000[Z]") + ".\n\r";
    payload += "SEQUENCE:0.\n\r";
    payload += "SUMMARY:Demo Event " + now.format("x") + ".\n\r";
    payload += "TRANSP:OPAQUE.\n\r";
    payload += "UID:" + uuidEvent + ".\n\r";
    payload += "END:VEVENT.\n\r";
    payload += "END:VCALENDAR.\n\r";

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
        }
        else {
            t.fail(error);
        }
    });

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
});
