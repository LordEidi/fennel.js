/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

// Authentication module.
var auth = require('http-auth');

var basic = auth.basic(
    {
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