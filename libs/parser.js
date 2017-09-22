/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2016-17 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 -----------------------------------------------------------------------------*/

var log4js = require('log4js');
var log = log4js.getLogger("parser");

function parseICS(file)
{
    //TODO caveman parser, should be replaced with something more stable
    var lines = file.split(/[\r\n|\n\r|\n|\r]/g);

    var result = "";

	// Remove empty lines
	for(var j = 1; j < lines.length; j++)
    {
		if (lines[j].length == 0)
		{
			lines.splice(j, 1);
		}
	}

	// Unfold the lines, if no : assume it is folded with previous
	for(var j = 1; j < lines.length; j++)
    {
		if (lines[j].indexOf(":") == -1)
		{
			lines[j-1] = lines[j-1] + lines[j];
			lines.splice(j, 1);
			j--; // make sure to decrease the counter since we deleted one line...
		}
	}
	
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
