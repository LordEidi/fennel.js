/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by 
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
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

var cr = require('crossroads');
var http = require('http');
var parseString = require('xml2js').parseString;
var util = require('util');

// Authentication module.
var auth = require('http-auth');
var crypto = require('crypto');

var user = "";

var basic = auth.basic({
        realm: "Fennel"
    }, function (username, password, callback) 
    	{ // Custom authentication method.
    		callback(checkLogin(username, password));
		}
);

function checkLogin(username, password)
{
	console.log("Login");
	console.log(username);
	user = username;
	
	var md5 = crypto.createHash('md5');
	md5.update(password);
	
	console.log(password);
	console.log(md5.digest('hex')); 
	
	return true;
}

cr.addRoute('/{id}', function(id){
  console.log(id);
});

cr.addRoute('/calendars/{id}', function(id){
  console.log(id);
});



// Listen on port 8888, IP defaults to 127.0.0.1
http.createServer(function (req, res) 
{
//	console.log(req);
	console.log("---------------------------------------------");
	console.log(req.method);
	console.log(req.url);
	
	var body = "";
	
	cr.addRoute('/.well-known/{id}', function(id)
	{
		console.log(id);
		
		res.writeHead(302, 
		{
		  'Location': '/p/'
		  //add other headers here...
		});
		res.end();
	
	});
		
	
		
//		console.log(res);

	req.on('data', function (data) 
	{
		body += data.toString();
//		console.log(data.toString());
    });
    
    req.on('end',function(){
    	console.log('end');
//    	console.log(body);
    	
    	parseString(body, function (err, result) {
//			console.dir(result);
//			console.log(util.inspect(result, false, null))

			switch(req.method)
				{
					case 'PROPFIND':
						callPropfind(req, res);
						break;
						
					case 'PROPPATCH':
						callProppatch(req, res);
						break;
			
					case 'OPTIONS':
						callOptions(req, res);
						break;
						
					case 'REPORT':
						callReport(req, res);
						break;
						
					default:
						res.writeHead(207);
						res.end("DAV: 1, calendar-access, calendar-schedule, calendar-proxy");
						break;
			
				}
		});
    });


	cr.parse(req.url);
	
	
}).listen(8888);

function createCalendar(res, uuid, name)
{
		res.write("	<d:response>");
		res.write("		<d:href>/p/name/calendars/" + uuid + "/</d:href>");
		res.write("		<d:propstat>");
		res.write("			<d:prop>");
		res.write("				<d:current-user-privilege-set>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read-free-busy xmlns:d=\"urn:ietf:params:xml:ns:caldav\"/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-acl/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-properties/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-content/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:bind/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:unbind/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:unlock/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read-acl/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read-current-user-privilege-set/>");
		res.write("					</d:privilege>");
		res.write("				</d:current-user-privilege-set>");
		res.write("				<d:owner>");
		res.write("					<d:href>/p/name/</d:href>");
		res.write("				</d:owner>");
		res.write("				<d:sync-token>http://sabredav.org/ns/sync/5</d:sync-token>");
		res.write("				<cs:allowed-sharing-modes>");
		res.write("					<cs:can-be-shared/>");
		res.write("					<cs:can-be-published/>");
		res.write("				</cs:allowed-sharing-modes>");
		res.write("				<x6:calendar-color xmlns:x6=\"http://apple.com/ns/ical/\">#F64F00FF</x6:calendar-color>");
		res.write("				<x6:calendar-order xmlns:x6=\"http://apple.com/ns/ical/\">1</x6:calendar-order>");
		res.write("				<cal:calendar-timezone>BEGIN:VCALENDAR&#13;");
		res.write("VERSION:2.0&#13;");
		res.write("PRODID:-//Apple Inc.//Mac OS X 10.9.1//EN&#13;");
		res.write("CALSCALE:GREGORIAN&#13;");
		res.write("BEGIN:VTIMEZONE&#13;");
		res.write("TZID:Europe/Zurich&#13;");
		res.write("BEGIN:DAYLIGHT&#13;");
		res.write("TZOFFSETFROM:+0100&#13;");
		res.write("RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU&#13;");
		res.write("DTSTART:19810329T020000&#13;");
		res.write("TZNAME:GMT+2&#13;");
		res.write("TZOFFSETTO:+0200&#13;");
		res.write("END:DAYLIGHT&#13;");
		res.write("BEGIN:STANDARD&#13;");
		res.write("TZOFFSETFROM:+0200&#13;");
		res.write("RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU&#13;");
		res.write("DTSTART:19961027T030000&#13;");
		res.write("TZNAME:GMT+1&#13;");
		res.write("TZOFFSETTO:+0100&#13;");
		res.write("END:STANDARD&#13;");
		res.write("END:VTIMEZONE&#13;");
		res.write("END:VCALENDAR&#13;");
		res.write("</cal:calendar-timezone>");
		res.write("				<d:displayname>" + name + "</d:displayname>");
		res.write("				<cs:getctag>http://sabredav.org/ns/sync/5</cs:getctag>");
		res.write("				<cs:pre-publish-url>");
		res.write("					<d:href>https://localhost/" + uuid + ".ics</d:href>");
		res.write("				</cs:pre-publish-url>");
		res.write("				<cal:schedule-calendar-transp>");
		res.write("					<cal:opaque/>");
		res.write("				</cal:schedule-calendar-transp>");
		res.write("				<cal:supported-calendar-component-set>");
		res.write("					<cal:comp name=\"VTODO\"/>");
		res.write("				</cal:supported-calendar-component-set>");
		res.write("				<d:resourcetype>");
		res.write("					<d:collection/>");
		res.write("					<cal:calendar/>");
		res.write("				</d:resourcetype>");
		res.write("				<d:supported-report-set>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<cal:calendar-multiget/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<cal:calendar-query/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<cal:free-busy-query/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:expand-property/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:principal-property-search/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:principal-search-property-set/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:sync-collection/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("				</d:supported-report-set>");
		res.write("			</d:prop>");
		res.write("			<d:status>HTTP/1.1 200 OK</d:status>");
		res.write("		</d:propstat>");
		res.write("	</d:response>");
}


// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8888/");

function callPropfind(req, res)
{
	console.log("Call PROPFIND");
	
	if(req.url.indexOf("calendars") > -1)
	{
		console.log("return calendar");
		
		res.setHeader("Content-Type", "application/xml; charset=UTF-8");
		res.setHeader("DAV", "1, 3, extended-mkcol, calendar-access, calendar-proxy, calendarserver-sharing, calendarserver-subscribed, addressbook, addressbook, access-control, calendarserver-principal-property-search");
		res.setHeader("Server", "Fennel");

		res.writeHead(207);
		
		res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:s=\"http://sabredav.org/ns\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\">");		
		res.write("<d:response>");
		res.write("		<d:href>" + req.url + "</d:href>");
		res.write("		<d:propstat>");
		res.write("			<d:prop>");
		res.write("				<d:current-user-privilege-set>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-acl/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-properties/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:write-content/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:bind/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:unbind/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:unlock/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read-acl/>");
		res.write("					</d:privilege>");
		res.write("					<d:privilege xmlns:d=\"DAV:\">");
		res.write("						<d:read-current-user-privilege-set/>");
		res.write("					</d:privilege>");
		res.write("				</d:current-user-privilege-set>");
		res.write("				<d:owner>");
		res.write("					<d:href>/p/name/</d:href>");
		res.write("				</d:owner>");
		res.write("				<d:resourcetype>");
		res.write("					<d:collection/>");
		res.write("				</d:resourcetype>");
		res.write("				<d:supported-report-set>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:sync-collection/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:expand-property/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:principal-property-search/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("					<d:supported-report>");
		res.write("						<d:report>");
		res.write("							<d:principal-search-property-set/>");
		res.write("						</d:report>");
		res.write("					</d:supported-report>");
		res.write("				</d:supported-report-set>");
		res.write("			</d:prop>");
		res.write("			<d:status>HTTP/1.1 200 OK</d:status>");
		res.write("		</d:propstat>");
		res.write("	</d:response>");
		
		createCalendar(res, "108e8519-0957-4afb-a954-eb78a14d3382", "Tasks");
		createCalendar(res, "4fa1e8c7-3b9b-4511-a774-69c98ae3eb3c", "Calendar");
		
		res.write("</d:multistatus>");
		res.end("");
	
	}
	else
	{
		res.setHeader("Content-Type", "application/xml; charset=UTF-8");
		res.setHeader("DAV", "1, 3, extended-mkcol, calendar-access, calendar-proxy, calendarserver-sharing, calendarserver-subscribed, addressbook, addressbook, access-control, calendarserver-principal-property-search");
		res.setHeader("Server", "Fennel");
		res.writeHead(207);
	
		res.write("<?xml version='1.0' encoding='UTF-8'?>\r\n");
		res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
		res.write("  <d:response>\r\n");
		res.write("    <d:href>" + req.url + "</d:href>\r\n");
		res.write("    <d:propstat>\r\n");
		res.write("      <d:prop>\r\n");
		res.write("        <d:principal-URL>\r\n");
		res.write("        		<d:href>/p/name/</d:href>\r\n");
		res.write("        </d:principal-URL>\r\n");
		res.write("        <d:displayname>lord test</d:displayname>\r\n");
		res.write("        <d:principal-collection-set>\r\n");
		res.write("        	<d:href>/p/uid/</d:href>\r\n");
		res.write("        </d:principal-collection-set>\r\n");
		res.write("        <d:current-user-principal>\r\n");
		res.write("        	<d:href>/p/name/</d:href>\r\n");
		res.write("        </d:current-user-principal>\r\n");
		res.write("        <cal:calendar-home-set>\r\n");
		res.write("        	<d:href>/p/name/calendars/</d:href>\r\n");
		res.write("        </cal:calendar-home-set>\r\n");
		res.write("        <cal:calendar-user-address-set>\r\n");
		res.write("        	<d:href>mailto:lord test at swordlord.com</d:href>\r\n");
		res.write("        	<d:href>/p/name/</d:href>\r\n");
		res.write("        </cal:calendar-user-address-set>\r\n");
		res.write("        <cs:notification-URL>\r\n");
		res.write("        	<d:href>/p/name/calendars/notifications/</d:href>\r\n");
		res.write("        </cs:notification-URL>\r\n");
		res.write("        <d:supported-report-set>\r\n");
		res.write("        	<d:supported-report>\r\n");
		res.write("        		<d:report>\r\n");
		res.write("        			<d:expand-property/>\r\n");
		res.write("        		</d:report>\r\n");
		res.write("        	</d:supported-report>\r\n");
		res.write("        	<d:supported-report>\r\n");
		res.write("        		<d:report>\r\n");
		res.write("        			<d:principal-property-search/>\r\n");
		res.write("        		</d:report>\r\n");
		res.write("        	</d:supported-report>\r\n");
		res.write("        	<d:supported-report>\r\n");
		res.write("        		<d:report>\r\n");
		res.write("        			<d:principal-search-property-set/>\r\n");
		res.write("        		</d:report>\r\n");
		res.write("        	</d:supported-report>\r\n");
		res.write("        </d:supported-report-set>\r\n");
		res.write("      </d:prop>\r\n");
		res.write("		<d:status>HTTP/1.1 200 OK</d:status>\r\n");
		res.write("    </d:propstat>\r\n");
		res.write("  </d:response>\r\n");
		res.write("</d:multistatus>\r\n");
		res.end("");
		
	}
}

function callOptions(req, res)
{
	console.log("Call OPTIONS");
	
	res.setHeader("Content-Type", "application/xml; charset=UTF-8");
	res.setHeader("DAV", "1, 3, extended-mkcol, calendar-access, calendar-schedule, calendar-proxy");
	res.setHeader("Allow", "OPTIONS, PROPFIND, HEAD, GET, REPORT, PROPPATCH, PUT, DELETE, POST");
	res.setHeader("Server", "Fennel");
	
	
	res.setHeader("Cache-Control", "private, max-age=0");
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "SAMEORIGIN");
	res.setHeader("X-XSS-Protection", "1; mode=block");

	res.writeHead(200);

	res.end("");
}

function callReport(req, res)
{
	console.log("Call REPORT");
	
	res.setHeader("Content-Type", "application/xml; charset=UTF-8");
	res.setHeader("Server", "Fennel");
	
	res.writeHead(200);

	
	res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	res.write("<d:principal-search-property-set xmlns:d=\"DAV:\" xmlns:s=\"http://sabredav.org/ns\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
	res.write("  <d:principal-search-property>\r\n");
	res.write("    <d:prop>\r\n");
	res.write("      <d:displayname/>\r\n");
	res.write("    </d:prop>\r\n");
	res.write("    <d:description xml:lang=\"en\">Display name</d:description>\r\n");
	res.write("  </d:principal-search-property>\r\n");
	res.write("  <d:principal-search-property>\r\n");
	res.write("    <d:prop>\r\n");
	res.write("      <s:email-address/>\r\n");
	res.write("    </d:prop>\r\n");
	res.write("    <d:description xml:lang=\"en\">Email address</d:description>\r\n");
	res.write("  </d:principal-search-property>\r\n");
	res.write("</d:principal-search-property-set>\r\n");
	 
	res.end("");

}

function callProppatch(req, res)
{
	console.log("Call PROPPATCH");
	
	res.setHeader("Content-Type", "application/xml; charset=UTF-8");
	res.setHeader("Server", "Fennel");
	
	res.writeHead(200);

	
	res.write("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
	res.write("<d:multistatus xmlns:d=\"DAV:\" xmlns:s=\"http://sabredav.org/ns\" xmlns:cal=\"urn:ietf:params:xml:ns:caldav\" xmlns:cs=\"http://calendarserver.org/ns/\" xmlns:card=\"urn:ietf:params:xml:ns:carddav\">\r\n");
	res.write("	<d:response>\r\n");
	res.write("		<d:href>" + req.url + "</d:href>\r\n");
	res.write("		<d:propstat>\r\n");
	res.write("			<d:prop>\r\n");
	res.write("				<cal:default-alarm-vevent-date/>\r\n");
	res.write("			</d:prop>\r\n");
	res.write("			<d:status>HTTP/1.1 403 Forbidden</d:status>\r\n");
	res.write("		</d:propstat>\r\n");
	res.write("	</d:response>\r\n");
	res.write("</d:multistatus>\r\n");

	 
	res.end("");
}
