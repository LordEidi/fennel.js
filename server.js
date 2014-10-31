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
var config = require('./config').config;
var authlib = require('./libs/authentication');
var http = require('http');
var url = require('url');
var log = require('./libs/log').log;
var handler = require('./libs/requesthandler');

//var user = "";
var net = require('net');

var reqlib = require('./libs/request');
var httpauth = require('http-auth');

var basic = httpauth.basic(
    {
        realm: "Fennel"
    }, function (username, password, callback)
    {
        authlib.checkLogin(username, password, callback);
    }
);

// Listen on port 8888, IP defaults to 127.0.0.1
var server = http.createServer(basic, function (req, res)
{
    //log.debug("Request started");
	log.debug("Method: " + req.method + ", URL: " + req.url);

	var body = "";

    req.on('data', function (data)
    {
        body += data.toString();
    });

    req.on('end',function()
    {
        var request = new reqlib.request(req, res, body);

        var pathname = url.parse(req.url).pathname;

        if(pathname.charAt(0) == '/')
        {
            pathname = pathname.substr(1);
        }

        var aUrl = pathname.split("/");
        switch(aUrl[0])
        {
            case '.well-known':
                log.debug("Called .well-known URL for " + aUrl[1] + ". Redirecting to /p/");

                res.writeHead(302,
                    {
                        'Location': '/p/'
                        //add other headers here...?
                    });
                break;

            case 'p':
                handler.handlePrincipal(request);
                break;

            case 'cal':
                handler.handleCalendar(request);
                break;

            case 'card':
                handler.handleCard(request);
                break;

            case '':
                handler.handleCalendar(request);
                break;

            default:
                log.info("URL unknown: " + req.url);
                res.writeHead(500);
                res.write(req.url + " is not known");
                break;
        }

        request.closeResponseAutomatically();
    });
});

server.listen(config.port);

server.on('error', function (e)
{
    log.debug("Error: " + e);
});

//catch any connection event to this server
server.on('connection', function (stream) {
    //create a new buffer to hold what we are receiving in this stream
    var receiveBuffer = new Buffer(0);
    //store a link to the original ondata function so we can call it and restore it
    stream._ondataOld = stream.ondata;
    stream.ondata = function(d,start,end){
        receiveBuffer = Buffer.concat([receiveBuffer, d.slice(start, end)]);
        //if what we have received is greater than 4 (i.e. we have at least got a GET request)
        //then make changes
        if (receiveBuffer.length >= 4) {
            //reset the streams ondata function to the original
            //this is all we want to edit for this connection
            stream.ondata = stream._ondataOld;
            //if the first 11 characters of the buffer are 'MKCALENDAR ' then make a change
            if (receiveBuffer.toString('ascii', 0, 11) === 'MKCALENDAR ') {
                //I change this to MKCOL /MKCALENDAR<rest of buffer> as this will work with the node.js http parser
                //and then I can check on the other side for a MKCOL method with /MKCALENDAR as the start of the url and
                //know that it was a MKCALENDAR method
                //this facilitates MKCALENDAR calls on the CALDAV server
                //var rewrittenBuffer = Buffer.concat([new Buffer('MKCOL /MKCALENDAR', 'ascii'), receiveBuffer.slice(11)]);
                var rewrittenBuffer = Buffer.concat([new Buffer('MKCOL ', 'ascii'), receiveBuffer.slice(11)]);
                //console.log(rewrittenBuffer.toString('ascii',0,rewrittenBuffer.length));
                //console.log(rewrittenBuffer.toString('ascii'));
                //now call the original ondata function with this new buffer
                stream.ondata(rewrittenBuffer,0,rewrittenBuffer.length);
            } else {
                //no change needed just call the original ondata function with this buffer
                stream.ondata(d,start,end);
            }
        } else {
            stream.ondata(d,start,end);
        }
    }
});

// Put a friendly message on the terminal
log.info("Server running at http://" + config.ip + ":" + config.port + "/");
