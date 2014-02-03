/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var log = require('../libs/log').log;
var userLib = require('../libs/user');
var url = require('url');

// Exporting.
module.exports = {
    request: request
};

function request(req, res, body)
{
    this.req = req;
    this.res = res;
    this.body = body;

    var header = req.headers['authorization']||'';        // get the header
    var token = header.split(/\s+/).pop()||'';            // and the encoded auth token
    var auth = new Buffer(token, 'base64').toString();    // convert from base64
    var parts = auth.split(/:/);                          // split on colon
    var username = parts[0];

    this.user = new userLib.user(username);

    this.closeResAutomatically = true;

    return this;
}

request.prototype.dontCloseResAutomatically = function()
{
    this.closeResAutomatically = false;
};

request.prototype.closeResponseAutomatically = function()
{
    if(this.closeResAutomatically)
    {
        this.res.end();
    }
};

request.prototype.closeRes = function()
{
    this.res.end();
};


request.prototype.getUser = function()
{
    return this.user;
};

/*
request.prototype.setUser = function(user)
{
    this.user = user;
};
*/

request.prototype.getReq = function()
{
    return this.req;
};

request.prototype.getRes = function()
{
    return this.res;
};

request.prototype.getBody = function()
{
    return this.body;
};

request.prototype.getURL = function()
{
    return this.req.url;
};

request.prototype.getURLAsArray = function()
{
    var aUrl = url.parse(this.req.url).pathname.split("/");
    if(aUrl.length <= 0)
    {
        log.warn('Something evil happened in calendar.put!');
        return undefined;
    }

    return aUrl;
};

request.prototype.getFilenameFromPath = function(removeEnding)
{
    var aUrl = url.parse(this.req.url).pathname.split("/");
    if(aUrl.length <= 0)
    {
        log.warn('Something evil happened in calendar.put!');
        return undefined;
    }

    var filename = aUrl[aUrl.length - 1];

    if(removeEnding)
    {
        filename = filename.substr(0, filename.length - 4);
    }

    return filename;
};

request.prototype.getLastPathElement = function()
{
    var aUrl = url.parse(this.req.url).pathname.split("/");
    if(aUrl.length <= 0)
    {
        log.warn('Something evil happened in calendar.put!');
        return undefined;
    }

    return aUrl[aUrl.length - 2];
};

request.prototype.getPathElement = function(position)
{
    var aUrl = url.parse(this.req.url).pathname.split("/");
    if(aUrl.length <= 0)
    {
        log.warn('Something evil happened in calendar.put!');
        return undefined;
    }

    return aUrl[position];
};

request.prototype.getUrlElementSize = function()
{
    var aUrl = url.parse(this.req.url).pathname.split("/");
    return aUrl.length;
};

request.prototype.stringEndsWith = function(str, suffix)
{
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
