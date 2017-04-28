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

var config = require('../../config').config;

var username = config.test_user_name;
var password = config.test_user_pwd;

var payload = "<?xml version='1.0' encoding='UTF-8'?>\n\r";
payload += "<B:mkcalendar xmlns:B=\"urn:ietf:params:xml:ns:caldav\">\n\r";
payload += "<A:set xmlns:A=\"DAV:\">\n\r";
payload += "<A:prop>\n\r";
payload += "<B:supported-calendar-component-set>\n\r";
payload += "    <B:comp name=\"VEVENT\"/>\n\r";
payload += "</B:supported-calendar-component-set>\n\r";
payload += "<A:displayname>Three</A:displayname>\n\r";
payload += "<D:calendar-order xmlns:D=\"http://apple.com/ns/ical/\">4</D:calendar-order>\n\r";
payload += "<B:schedule-calendar-transp>\n\r";
payload += "    <B:transparent/>\n\r";
payload += "</B:schedule-calendar-transp>\n\r";
payload += "<B:calendar-timezone>BEGIN:VCALENDAR&#13;\n\r";
payload += "VERSION:2.0&#13;\n\r";
payload += "CALSCALE:GREGORIAN&#13;\n\r";
payload += "BEGIN:VTIMEZONE&#13;\n\r";
payload += "TZID:Europe/Zurich&#13;\n\r";
payload += "BEGIN:DAYLIGHT&#13;\n\r";
payload += "TZOFFSETFROM:+0100&#13;\n\r";
payload += "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU&#13;\n\r";
payload += "DTSTART:19810329T020000&#13;\n\r";
payload += "TZNAME:GMT+2&#13;\n\r";
payload += "TZOFFSETTO:+0200&#13;\n\r";
payload += "END:DAYLIGHT&#13;\n\r";
payload += "BEGIN:STANDARD&#13;\n\r";
payload += "TZOFFSETFROM:+0200&#13;\n\r";
payload += "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU&#13;\n\r";
payload += "DTSTART:19961027T030000&#13;\n\r";
payload += "TZNAME:GMT+1&#13;\n\r";
payload += "TZOFFSETTO:+0100&#13;\n\r";
payload += "END:STANDARD&#13;\n\r";
payload += "END:VTIMEZONE&#13;\n\r";
payload += "END:VCALENDAR&#13;\n\r";
payload += "</B:calendar-timezone>\n\r";
payload += "<D:calendar-color xmlns:D=\"http://apple.com/ns/ical/\"\n\r";
payload += "symbolic-color=\"yellow\">#FFCC00</D:calendar-color>\n\r";
payload += "</A:prop>\n\r";
payload += "</A:set>\n\r";
payload += "</B:mkcalendar>\n\r";

test('Calling MKCALENDAR on demo user', function (t) {

    t.plan(1);

    var options = {
        method: 'MKCALENDAR',
        uri: "http://" + config.ip + ":" + config.port + "/cal/" + username + "/2A2AF854-18A0-47CB-870A-D94CA2341BAA/",
        auth: {
            'user': username,
            'pass': password,
            'sendImmediately': true
        } ,
        body: payload,
        followRedirect: false
    };

    request(options, function (error, response, body) {

        if (!error)
        {
            t.equal(response.statusCode, 201, "StatusCode matches");
            //t.equal(response.headers.allow, "OPTIONS, PROPFIND, HEAD, GET, REPORT, PROPPATCH, PUT, DELETE, POST, COPY, MOVE", "Options match");
            //console.log(body);
        }
        else
        {
            t.fail(error);
        }
    });
});
