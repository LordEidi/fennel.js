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

var Sequelize = require('sequelize-sqlite').sequelize;
var sqlite    = require('sequelize-sqlite').sqlite;

var sequelize = new Sequelize('fennel', 'user', 'pwd', {
    dialect: 'sqlite',
    storage: 'fennel.sqlite'
});

var ICS = sequelize.define('ICS', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    calendarId: { type: Sequelize.STRING, allowNull: false},
    content: { type: Sequelize.STRING, allowNull: false}
});

var CAL = sequelize.define('CAL', {
    pkey: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey: true},
    owner: { type: Sequelize.STRING, allowNull: false},
    timezone: { type: Sequelize.STRING, allowNull: false},
    order: { type: Sequelize.STRING, allowNull: false},
    free_busy_set: { type: Sequelize.STRING, allowNull: false},
    supported_cal_component: { type: Sequelize.STRING, allowNull: false},
    colour: { type: Sequelize.STRING, allowNull: false},
    displayname: { type: Sequelize.STRING, allowNull: false}
});

sequelize.sync().success(function()
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
    CAL: CAL
};