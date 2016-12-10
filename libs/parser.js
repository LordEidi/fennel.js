/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2016 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var log4js = require('log4js');
var log = log4js.getLogger("parser");

function parseICS(file)
{
    var lines = file.split(/[\r\n|\n\r|\n|\r]/g);

    var result = "";

    var len = lines.length;
    for(var i = 0; i < len; i++)
    {
        var el = lines[i];
        if(el.length > 0)
        {
            if(el.substr(0, 6) === "BEGIN:")
            {
                if(el.charAt(el.length -1) === ".")
                {
                    result += "\"" + el.substr(6, el.length -7) + "\": {";
                }
                else
                {
                    result += "\"" + el.substr(6) + "\": {";
                }
            }
            else if (el.substr(0, 4) === "END:")
            {
                // TODO: terrible hack, fixme
                if(result.charAt(result.length - 1) === ",")
                {
                    result = result.substr(0, result.length -1);
                }

                result += "},"
            }
            else
            {
                var arrLine = el.split(":");
                var key = arrLine[0];
                var val = arrLine[1];

                if(val.charAt(val.length -1) === ".")
                {
                    // todo: the key.split is a terrible hack as well, we loose some information like that
                    // example: DTEND;TZID=Europe/Zurich:20161210T010000Z. -> tzid will be lost
                    result += "\"" + key.split(";")[0] + "\":\"" + val.substr(0, val.length -1) + "\",";
                }
                else
                {
                    // todo, see above
                    result += "\"" + key.split(";")[0] + "\":\"" + val + "\",";
                }


            }
        }
    }

    // TODO: terrible hack, fixme
    if(result.charAt(result.length - 1) === ",")
    {
        result = result.substr(0, result.length -1);
    }

    result = "{" + result + "}";

    //console.log(result);

    return JSON.parse(result);
}

// Exporting.
module.exports = {
    parseICS: parseICS
};
