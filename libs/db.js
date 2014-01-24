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

var Schema = require('jugglingdb').Schema;
var schema = new Schema('sqlite3', {
    database: 'my.db'
});

var ICS = schema.define('ICS', {
    id: {type: String, limit: 50, index: true},
    calendar: {type: String}
});

var CAL = schema.define('CAL', {
    id: {type: String, limit: 50, index: true},
    timezone: {type: String},
    order: {type: Number},
    free_busy_set: {type: Boolean},
    supported_cal_component: {type: String},
    colour: {type: String},
    displayname: {type: String}
});

schema.autoupdate();
/*
schema.isActual(function(err, actual) {
    if (!actual) {
        log.info("DB structure is outdated, updating structure");
        schema.autoupdate();
    }
});
*/

// Exporting.
module.exports = {
    ICS: ICS,
    CAL: CAL
};

/*
ICS.updateOrCreate({
    field1: 300
}, {
    field1: 100
}, function(err, post){
    console.log('err: ' + err);
    console.log('post: ' + post);
});

ICS.count({}, function(err, count){
    console.log('err: ' + err);
    console.log('count: ' + count);
});
*/