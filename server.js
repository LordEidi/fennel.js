/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014-16 by
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

var reqlib = require('./libs/request');
var httpauth = require('http-auth');

var crossroads = require('crossroads');
crossroads.ignoreState = true;

var basic = httpauth.basic(
    {
        realm: "Fennel"
    }, function (username, password, callback)
    {
        authlib.checkLogin(username, password, callback);
    }
);

function onBypass(req, path)
{
    log.info('URL unknown: ' + path);

    var res = req.getRes();

    res.writeHead(500);
    res.write(req.url + " is not known");
    res.end();
}

function onHitRoot(req)
{
    log.debug("Called the root. Redirecting to /p/");

    req.getRes().writeHead(302,
        {
            'Location': '/p/'
            //add other headers here...?
        });
}

function onHitWellKnown(req, params)
{
    log.debug("Called .well-known URL for " + params + ". Redirecting to /p/");

    req.getRes().writeHead(302,
        {
            'Location': '/p/'
            //add other headers here...?
        });
}

function onHitPrincipal(req, params)
{
    handler.handlePrincipal(req);
}

function onHitCalendar(req, params)
{
    handler.handleCalendar(req);
}

function onHitCard(req, params)
{
    handler.handleCard(req);
}

crossroads.addRoute('/p/{params*}', onHitPrincipal);
crossroads.addRoute('/cal/{params*}', onHitCalendar);
crossroads.addRoute('/card/{params*}', onHitCard);
crossroads.addRoute('/.well-known/:params*:', onHitWellKnown);
crossroads.addRoute('/', onHitRoot);
crossroads.bypassed.add(onBypass);

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

        var sUrl = url.parse(req.url).pathname;
        log.info("URL requested: " + sUrl);
        crossroads.parse(sUrl, [request]);

        request.closeResponseAutomatically();
    });
});

server.listen(config.port);

server.on('error', function (e)
{
    log.debug("Error: " + e);
});

process.on('uncaughtException', function(err)
{
    console.log('Caught exception: ' + err);
});

// Put a friendly message on the terminal
log.info("Server running at http://" + config.ip + ":" + config.port + "/");
