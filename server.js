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
var http = require('http');
var url = require('url');
//var parseString = require('xml2js').parseString;

//var util = require('util');

//var crypto = require('crypto');

var log = require('./libs/log').log;
require('./libs/security');

var handler = require('./libs/requesthandler');

//var user = "";

// Listen on port 8888, IP defaults to 127.0.0.1
var server = http.createServer(function (req, res)
{
    log.debug("Request started");
	log.debug("Method: " + req.method + " URL: " + req.url);

	var body = "";

    /*
    cr.addRoute('/.well-known/{id}', function(req, res, id)
    {
        log.debug("Called .well-known URL for " + id + ". Redirecting to /p/");

        res.writeHead(302,
            {
                'Location': '/p/'
                //add other headers here...
            });
    });
*/

    req.on('data', function (data)
    {
        body += data.toString();
    });

    req.on('end',function()
    {
        var pathname = url.parse(req.url).pathname;
        if(pathname.charAt(0) == '/')
        {
            pathname = pathname.substr(1);
        }
        var aUrl = pathname.split("/");

        if(aUrl.length <= 0)
        {
            log.info("Requested root");
            res.writeHead(500);
            res.write("Nothing here");
            res.end();
        }
        else
        {
            switch(aUrl[0])
            {
                case '.well-known':
                    log.debug("Called .well-known URL for " + aUrl[1] + ". Redirecting to /p/");

                    res.writeHead(302,
                        {
                            'Location': '/p/'
                            //add other headers here...
                        });
                    break;

                case 'p':
                    handler.handlePrincipal(body, req, res, aUrl[1]);
                    break;

                case 'cal':
                    handler.handleCalendar(body, req, res, aUrl[1]);
                    break;

                case 'card':
                    handler.handleCard(body, req, res, aUrl[1]);
                    break;

                default:
                    log.info("URL unknown: " + req.url);
                    res.writeHead(500);
                    res.write(req.url + " is not known");
                    break;
            }
        }

        res.end();
    });
});

server.listen(8888);

server.on('error', function (e)
{
    log.debug(e);
});

// Put a friendly message on the terminal
log.info("Server running at http://127.0.0.1:8888/");
