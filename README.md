Fennel
======

![Fennel](https://raw.github.com/LordEidi/fennel/master/fennel_logo.png)

**Fennel** (c) 2014 by [SwordLord - the coding crew](http://www.swordlord.com/)

## Introduction ##

**Fennel** is a lightweight CardDAV / CalDAV server. It is completely written in JavaScript and runs within a Node.js instance.
It does have some dependencies regarding JavaScript libraries, but all of these can be installed with the help of the npm.

If you are looking for a lightweight CalDAV / CardDAV, **Fennel** might be for you:

- authentication is meant to be pluggable. While we concentrate on CourierAuth, you can add whatever can check a
username and password.
- the data storage backend is meant to be pluggable as well. While we start with SQLite3, we do use an ORM. Whatever
database can be used with *Sequelize* can be used as storage backend for **Fennel**. You just have to change the setting
accordingly.
- instead of inventing the wheel, we prefer to use some of those fine node.js based libraries.
- and after all, Fennel is OSS and is written in JavaScript. Whatever you do not like, you are free to replace / rewrite.


## Status ##

**Fennel** is beta software and should be handled as such:

- The CalDAV part is mostly done and now ready for a first public beta.
- The CardDAV part is running and now ready for a first public beta as well.

**Fennel** is tested on Calendar on iOS > v7.0 and on
OSX Calendar. If you run **Fennel** with another client your mileage may vary. Mozilla Lightning - as example - still
refuses to communicate with **Fennel**.

What's missing:

- password checks (while you can have multiple users, they are not really authenticated and accept all passwords)
- different clients (we will somewhen test with other clients, but we did not do thoroughly yet)


## Installation ##

First of all, you need a Node.js installation.

On Debian

    apt-get install nodejs

On OSX with brew

    brew install nodejs

Go into the directory where you want to run your copy of **Fennel** and install with the help of npm.

    cd /the/directory/with/fennel
    npm install fennel@beta
    nodemon server

Thats it, your instance of fennel should run now. All logs are sent to stdout for now. Have a look at */libs/log.js* if
you want to change the options.


## Configuration ##

All parameters which can be configured right now are in the file *config.js*. There are not much parameters yet, indeed.
But **Fennel** is not ready production anyway. And you are welcome to help out in adding parameters and configuration
options.


## How to run ##

Point your CalDAV and CardDAV client to the root of **Fennel**. All the rest should be managed by **Fennel** via
*./well-known* URLs and the chat between your client and **Fennel**.


## Contribution ##

If you happen to know how to write JavaScript, documentation or can help out with something else, drop us a note at *contact at swordlord dot com*. As more
helping hands we have, as quicker this server gets up and feature complete.


## Dependencies ##

For now, have a look at the package.json file.


## License ##

**Fennel** is published under the GNU General Public Licence version 3. See the LICENCE file for details.