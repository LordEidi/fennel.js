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
database can be used with that ORM can be used as storage for **Fennel**. You just have to change the setting accordingly.
- instead of inventing the wheel, we prefer to use some of those fine node.js based libraries.
- and after all, Fennel is OSS and is written in JavaScript. Whatever you do not like, you are free to replace / rewrite.


## Status ##

The CalDAV part is mostly done and now ready for a first public beta. **Fennel** is tested on Calendar on iOS > v7.0 and on
OSX Calendar. If you run **Fennel** with another client your mileage may vary.

What's missing:

- password checks (while you can have multiple users, they are not really authenticated and accept all passwords)
- different clients (we will somewhen test with Mozilla Thunderbird and other clients, but we did not do so yet)
- configuration (we will add a configuration file where you can change the properties)

Once the calendaring part is working, we will concentrate on the CardDAV part.


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

Thats it, your instance of fennel should run now.

## Contribution ##

If you happen to know how to write JavaScript, documentation or can help out with something else, drop us a note. As more
helping hands we have, as quicker this server gets up and feature complete.


## Dependencies ##

For now, have a look at the package.json file.


## License ##

**Fennel** is published under the GNU General Public Licence version 3. See the LICENCE file for details.