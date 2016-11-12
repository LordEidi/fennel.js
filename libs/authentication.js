/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014-16 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var log = require('../libs/log').log;
var config = require('../config').config;

var fs = require('fs');
var path = require('path');

function checkLogin(basicAuth, username, password, callback)
{
    log.debug("Login process started for user: " + username);

    switch(config.auth_method)
    {
        case 'courier':
            checkCourier(username, password, callback);
            break;

        case 'htaccess':
            checkHtaccess(basicAuth, username, password, callback);
            break;

        case 'ldap':
            checkLDAP(username, password, callback);
            break;

        default:
            log.info("No authentication method defined. Denying access.");
            callback(false);
            break;
    }
}

function checkHtaccess(basicAuth, username, password, callback)
{
    log.debug("Authenticating user with htaccess method.");

    var fHTAccess = path.resolve('.', config.auth_method_htaccess_file);

    if(!fs.existsSync(fHTAccess))
    {
        log.warn("File not found for htaccess authentication: " + fHTAccess);
        callback(false);
        return;
    }

    var strHTAccess = fs.readFileSync(fHTAccess, 'utf8');
    var lines = strHTAccess.replace(/\r\n/g, "\n").split("\n");

    for (var i in lines)
    {
        var line = lines[i];
        //log.debug("Read line from htaccess file: " + line);
        if(line.length > 0)
        {
            var ret = processLine(line);
            if(ret.username == username)
            {
                if(basicAuth.validate(ret.passwordhash, password))
                {
                    log.info("User logged in: " + username);
                    callback(true);
                    return;
                }
            }
        }
    }

    log.warn("User could not be logged in. Wrong username or password: " + username);
    callback(false);
}

function processLine(line)
{
    var pwdhash, lineSplit, username;
    lineSplit = line.split(":");
    username = lineSplit.shift();
    pwdhash = lineSplit.join(":");

    return new htaccessLine(username, pwdhash);
}

function htaccessLine(user, hash)
{
    this.username = user;
    this.passwordhash = hash;
}

function checkCourier(username, password, callback)
{
    log.debug("Authenticating user with courier method.");

    var socketPath = config.auth_method_courier_socket;
    log.debug("Using socket: " + socketPath);

    var client = net.createConnection({path: socketPath});

    client.on("connect", function() {
        //console.log('connect');
        var payload = 'service\nlogin\n' + username + '\n' + password;
        client.write('AUTH ' + payload.length + '\n' + payload);
    });

    var response = "";

    client.on("data", function(data) {
        //console.log('data: ' + data);
        response += data.toString();
    });

    client.on('end', function() {
        var result = response.indexOf('FAIL', 0);
        callback(result < 0);
    });
}

function checkLDAP(username, password, callback)
{
    var ldapjs;

    log.debug('Authenticating user with ldap method.');

    try {
        ldapjs = require('ldapjs');
    } catch (e) {
        log.error('ldapjs@1.0.0 node module not found');
        return callback(false);
    }

    var ldapClient = ldapjs.createClient({ url: config.auth_method_ldap_url });
    ldapClient.on('error', function (error) {
        log.warn('LDAP error', error);
        callback(false);
    });

    var ldapDn = 'cn=' + username + ',' + config.auth_method_ldap_user_base_dn;
    ldapClient.bind(ldapDn, password, function (error) {
        if (error) {
            log.warn('User could not be logged in. Wrong username or password: ' + username);
            callback(false);
        } else {
            log.info('User logged in: ' + username);
            callback(true);
        }
    });
}

// Exporting.
module.exports = {
    checkLogin: checkLogin
};