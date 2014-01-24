/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/
var log4js = require('log4js');
var log = log4js.getLogger("requesthandler");

var principal = require("../handler/principal");
var cal = require("../handler/calendar");

function handlePrincipal(request)
{
    // check if root url or cal or card url
    var method = request.getReq().method;
    switch(method)
    {
        case 'PROPFIND':
            principal.propfind(request);
            break;

        case 'PROPPATCH':
            principal.proppatch(request);
            break;

        case 'OPTIONS':
            principal.options(request);
            break;

        case 'REPORT':
            principal.report(request);
            break;

        default:
            var res = request.getRes();
            log.info("Request method is unknown: " + method);
            res.writeHead(500);
            res.write(method + " is not implemented yet");
            break;
    }
}

function handleCalendar(request)
{
    var method = request.getReq().method;
    switch(method)
    {
        case 'PROPFIND':
            cal.propfind(request);
            break;

        case 'PROPPATCH':
            cal.proppatch(request);
            break;

        case 'OPTIONS':
            cal.options(request);
            break;

        case 'REPORT':
            cal.report(request);
            break;

        case 'MKCAL':
        case 'MKCALENDAR':
            cal.makeCalendar(request);
            break;

        case 'PUT':
            cal.put(request);
            break;

        case 'GET':
            cal.get(request);
            break;

        case 'DELETE':
            cal.delete(request);
            break;

        default:
            var res = request.getRes();
            log.info("Request method is unknown: " + method);
            res.writeHead(500);
            res.write(method + " is not implemented yet");
            break;
    }
}

function handleCard(request)
{
    log.debug("card");
}


// Exporting.
module.exports = {
    handlePrincipal: handlePrincipal,
    handleCalendar: handleCalendar,
    handleCard: handleCard
};
