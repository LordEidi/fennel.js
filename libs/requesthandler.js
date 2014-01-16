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

function handlePrincipal(body, req, res, principalID)
{
    switch(req.method)
    {
        case 'PROPFIND':
            principal.propfind(body, req, res);
            break;

        case 'PROPPATCH':
            principal.proppatch(body, req, res);
            break;

        case 'OPTIONS':
            principal.options(body, req, res);
            break;

        case 'REPORT':
            principal.report(body, req, res);
            break;

        default:
            log.info("Request method is unknown: " + req.method);
            res.writeHead(500);
            res.write(req.method + " is not implemented yet");
            break;
    }
}

function handleCalendar(body, req, res, calID)
{
    log.debug("cal");
}

function handleCard(body, req, res, cardID)
{
    log.debug("card");
}


// Exporting.
module.exports = {
    handlePrincipal: handlePrincipal,
    handleCalendar: handleCalendar,
    handleCard: handleCard
};
