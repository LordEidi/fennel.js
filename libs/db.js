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

var Sequelize = require('sequelize');

var sequelize = new Sequelize(config.db_name, config.db_uid, config.db_pwd, {
    dialect: config.db_dialect,
    logging: function( info ) {if(config.db_logging){log.info(info)}}, // thanks to mdarveau for the fix
    storage: config.db_storage
});

var ICS = sequelize.define('ICS', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    calendarId: { type: Sequelize.STRING, allowNull: false},
    startDate: { type: Sequelize.DATE, allowNull: false},
    endDate: { type: Sequelize.DATE, allowNull: false},
    content: { type: Sequelize.TEXT, allowNull: false}
});

var CAL = sequelize.define('CAL', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    owner: { type: Sequelize.STRING, allowNull: false},
    timezone: { type: Sequelize.TEXT, allowNull: false},
    order: { type: Sequelize.STRING, allowNull: false},
    free_busy_set: { type: Sequelize.STRING, allowNull: false},
    supported_cal_component: { type: Sequelize.STRING, allowNull: false},
    colour: { type: Sequelize.STRING, allowNull: false},
    displayname: { type: Sequelize.STRING, allowNull: false},
    synctoken: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0}
});

var VCARD = sequelize.define('VCARD', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    ownerId: { type: Sequelize.STRING, allowNull: false},
    addressbookId: { type: Sequelize.STRING, allowNull: false},
    content: { type: Sequelize.TEXT, allowNull: false},
    is_group: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false}
});

var ADDRESSBOOK = sequelize.define('ADB', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    ownerId: { type: Sequelize.STRING, allowNull: false},
    name: { type: Sequelize.STRING, allowNull: false},
    synctoken: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0}
});

sequelize.sync().then(function()
    {
        log.info("Database structure updated");
    }).error(function(error)
    {
        log.error("Database structure update crashed: " + error);
    }
);

// Exporting.
module.exports = {
    ICS: ICS,
    CAL: CAL,
    VCARD: VCARD,
    ADB: ADDRESSBOOK,
    sequelize: sequelize
};