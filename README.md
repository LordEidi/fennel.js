Fennel
======

![Fennel](https://raw.github.com/LordEidi/fennel/master/fennel_logo.png)

**Fennel** (c) 2014 by SwordLord - the coding crew

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

The CalDAV part is nearly done and ready for a first public beta.

Once the calendaring part is working, we will concentrate on the CardDAV part.


## Contribution ##

If you happen to know how to write JavaScript, documentation or can help out with something else, drop us a note. As more
helping hands we have, as quicker this server gets up and feature complete.


## Dependencies ##

For now, have a look at the package.json file.


## License ##

**Fennel** is published under the GNU General Public Licence version 3. See the LICENCE file for details.