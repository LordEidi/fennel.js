/*-----------------------------------------------------------------------------
 **
 ** - Fennel Card-/CalDAV -
 **
 ** Copyright 2014-16 by
 ** SwordLord - the coding crew - http://www.swordlord.com
 ** and contributing authors
 **
 ** This program is free software; you can redistribute it and/or modify it
 ** under the terms of the GNU General Public License as published by the Free
 ** Software Foundation, either version 3 of the License, or (at your option)
 ** any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 ** more details.
 **
 ** You should have received a copy of the GNU General Public License along
 ** with this program. If not, see <http://www.gnu.org/licenses/>.
 **
 **-----------------------------------------------------------------------------
 **
 ** Original Authors:
 ** LordEidi@swordlord.com
 ** LordLightningBolt@swordlord.com
 **
 ** $Id:
 **
 -----------------------------------------------------------------------------*/

// Place all your configuration options here

var config =
{
    version_nr: '0.1.0',

    // Server specific configuration
    // Please use a proxy in front of Fennel to support TLS.
    // We suggest you use nginx as the TLS endpoint
    port: 8888,
    //port: 80,
    ip: '127.0.0.1',
    //ip: '0.0.0.0',

    // db specific configuration. you can use whatever sequelize supports.
    db_name: 'fennel',
    db_uid: 'uid',
    db_pwd: 'pwd',
    db_dialect: 'sqlite',
    db_logging: true,
    db_storage: 'fennel.sqlite',

    // Authentication
    // Authentication methods so far: courier, htaccess, ldap
    auth_method: 'htaccess',
    auth_method_courier_socket: '/var/run/courier/authdaemon/socket',
    auth_method_htaccess_file: 'demouser.htaccess',

    // ldap authentication requires the ldapjs@1.0.0 node module. Please install manually
    auth_method_ldap_url: 'ldap://localhost:3002',
    auth_method_ldap_user_base_dn: 'ou=users,dc=example',


    // Authorisation
    // Authorisation Rules:
    // This property takes an array of Shiro formatted strings. Users are
    // only permitted access to resources when said access is explicitly
    // allowed here. Please see http://shiro.apache.org/permissions.html
    // for a short introduction to Shiro Syntax.
    //
    // Fennel uses the URL + the function to check for authorisation.
    // /card/demo/default/card_id.vcf with method PUT will become
    // card:demo:default:card_id.vcf:put
    //
    // Please note that $username is not recognised by shiro-trie but
    // will be replaced by Fennel with the current user when loaded into
    // the current process.
    //
    // The current set will allow the owner to access his or her own stuff
    authorisation: [
        'cal:$username:*',
        'card:$username:*',
        'p:options,report',
        'p:$username:*'
    ],

    test_user_name: 'demo',
    test_user_pwd: 'demo'
};

// Exporting.
module.exports = {
    config: config
};