Fennel.js
=========

![Fennel.js](https://raw.github.com/LordEidi/fennel.js/master/fennel_logo.png)

**Fennel.js** (c) 2014-17 by [SwordLord - the coding crew](http://www.swordlord.com/)

## Introduction ##

**Fennel.js** is a proof of concept CardDAV / CalDAV server written in JavaScript. It runs within a Node.js instance.


## Important ##

**Fennel.js** started as a proof of concept to check the technical possibilities of Node.js and JavaScript as well as to validate the complexity of writing your own CalDAV and CardDAV server.

When starting with **Fennel.js**, we quickly noticed a few challenges with the chosen technology. One of which is getting a lightweight, hassle free installation. This is the main reason that we from [SwordLord - the coding crew](http://www.swordlord.com/) decided to slow down development on the **Fennel.js* port and focus our efforts on the new Go based [Fennel](https://github.com/swordlordcodingcrew/fennel) version instead.

If you need to use JavaScript / Node.js and you can life with fact that the quirks will not be addressed quickly, stay on **Fennel.js**.

If you prefer quicker development and a hassle free installation and maintenance. Have a look at [Fennel](https://github.com/swordlordcodingcrew/fennel)

## What is Fennel.js ##

If you are looking for a lightweight CalDAV / CardDAV server, **Fennel.js** might be for you:

- authentication is meant to be pluggable. While we concentrate on CourierAuth and .htaccess, you can add whatever can check a
username and password.
- the data storage backend is meant to be pluggable as well. While we start with SQLite3, we do use an ORM. Whatever
database can be used with *Sequelize* can be used as storage backend for **Fennel.js**. You just have to change the settings
accordingly.
- instead of inventing the wheel, we prefer to use some of those fine node.js based libraries.
- and after all, **Fennel.js** is OSS and is written in JavaScript. Whatever you do not like, you are free to replace / rewrite. Just respect the licence and give back.

## Status ##

**Fennel.js** is beta software and should be handled as such:

- The development on this project slowed down. We are now concentrating on the Go port of [Fennel](https://github.com/swordlordcodingcrew/fennel).
- The CalDAV part is mostly done and now ready for a first public beta.
- The CardDAV part is running and now ready for a first public beta as well.

**Fennel.js** is tested on Calendar on iOS > v7.0 and on OSX Calendar as well as with Mozilla Lightning. If you run
**Fennel.js** with another client your mileage may vary.

What's missing:

- different clients (we will somewhen test with other clients, but we did not do thoroughly yet)
- Test cases for everything. We would love to have test cases for as many scenarios and features as possible. It is a pain in the neck to test **Fennel.js** otherwise.
- While **Fennel.js**'s goal is to have an RBAC based authorisation system, **Fennel.js** does currently only know global permissions without groups.

## Installation ##

First of all, you need a Node.js installation.

### nodejs on Debian ###

Make sure that you have this line in your /etc/apt/sources.list file:

    deb http://YOURMIRROR.debian.org/debian jessie main

and then run:

    sudo apt-get install nodejs nodejs-legacy npm
    // eventually the next line as well
    // sudo ln -s /usr/lib/nodejs/ /usr/lib/node

### nodejs on OSX with homebrew ###

    brew install node
    brew install npm

### Installation of **Fennel.js** ###

If you want to run **Fennel.js** under a specific user (node), do this:

    sudo adduser node
    su node
    cd
    mkdir fennel
    cd fennel

Go into the directory where you want to run your copy of **Fennel.js** and get the latest and greatest:

    cd /home/node/fennel
    git clone https://github.com/LordEidi/fennel.js.git

And then with the magic of npm get the required libraries

    npm install

If everything worked according to plan, you should now have a new installation of the latest **Fennel.js**.

### Use supervisord to run **Fennel.js** as a service ###

Now we want to make sure that **Fennel.js** runs forever. First install the required software:

    sudo apt-get install supervisor

Then copy the file utilities/fennel_supervisor.conf into your local supervisor configuration directory. This is usually done like this:
 
    cp utilities/fennel_supervisor.conf /etc/supervisor/conf.d/fennel.conf 
    
Make sure you change the configuration to your local setup.

### How to set up transport security ###

Since **Fennel.js** does not bring it's own crypto, you may need to install a TLS server in front of **Fennel.js**. You can do so
with nginx, which is a lightweight http server and proxy.

First prepare your /etc/apt/sources.list file (or just install the standard Debian package, your choice):

    deb http://nginx.org/packages/debian/ jessie nginx
    deb-src http://nginx.org/packages/debian/ jessie nginx

Update apt-cache and install nginx to your system.

    sudo update
    sudo apt-get install nginx

Now configure a proxy configuration so that your instance of nginx will serve / prox the content of / for the
**Fennel.js** server. To do so, you will need a configuration along this example:

    server {
        listen   443;
        server_name  carl.yourdomain.tld;

        access_log  /var/www/logs/fennel_access.log combined;
        error_log  /var/www/logs/fennel_error.log;

        root /var/www/pages/;
        index  index.html index.htm;

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /var/www/nginx-default;
        }

        location / {
            proxy_pass         http://127.0.0.1:8888;
            proxy_redirect     off;
            proxy_set_header   Host             $host;
            proxy_set_header   X-Real-IP        $remote_addr;
            proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
            proxy_buffering    off;
        }

        ssl  on;
        ssl_certificate  /etc/nginx/certs/yourdomain.tld.pem;
        ssl_certificate_key  /etc/nginx/certs/yourdomain.tld.pem;
        ssl_session_timeout  5m;

        # modern configuration. tweak to your needs.
        ssl_protocols TLSv1.1 TLSv1.2;
        ssl_ciphers 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK';
        ssl_prefer_server_ciphers on;
    
        # HSTS (ngx_http_headers_module is required) (15768000 seconds = 6 months)
        add_header Strict-Transport-Security max-age=15768000;
    }

Please check this site for updates on what TLS settings currently make sense:

[https://mozilla.github.io/server-side-tls/ssl-config-generator](https://mozilla.github.io/server-side-tls/ssl-config-generator)

Now run or reset your nginx and start your instance of **Fennel.js**.

Thats it, your instance of **Fennel.js** should run now. All logs are sent to stdout for now. Have a look at */libs/log.js* if
you want to change the options.

## Configuration ##

All parameters which can be configured right now are in the file *config.js*. There are not much parameters yet, indeed.
But **Fennel.js** is not ready production anyway. And you are welcome to help out in adding parameters and configuration
options.

### Authentication - auth_method ###

The authentication method to use to authenticate users. Supported methods so far:

- Courier: use a local courier authdaemon socket. You will need to fill in this config option as well: auth_method_courier_socket
- htaccess: use an htaccess file to authenticate the users. You will need to fill in this option as well: auth_method_htaccess_file
- LDAP: use an ldap server to authenticate users. You will need to fill in the options auth_method_ldap_url and auth_method_ldap_user_base_dn and make sure to have ldapjs@1.0.0 installed.


### Authorisation ###

**Fennel.js**'s authorisation strategy is based on the npm module shiro-trie. Permissions are written in an [Apache Shiro](http://shiro.apache.org/permissions.html)-like style.

Permission is given on an URL and http method basis. Which means permissions can be given on a specific URL and method or with a wildcard character on multiple URLs and methods.

When defining your own permissions, make sure to change the URL syntax to the shiro syntax. Which means that /my/url/ becomes my:url. See the standard configuration for details.

While **Fennel.js**'s goal is to have an RBAC based authorisation system, **Fennel.js** does currently only know global permissions without groups. See also [Contribution](Contribution).

## How to run ##

Point your CalDAV and CardDAV client to the root of **Fennel.js**. All the rest should be managed by **Fennel.js** via
*./well-known* URLs and the chat between your client and **Fennel.js**.


## Test cases ##

There are a few test cases to check the working of **Fennel.js**. Make sure to

- check your configuration, especially the test user and password.
- run an instance of **Fennel.js**.
- run: npm test

You can find the test cases in the test directory. All cases are made to be run against your (local) copy of **Fennel.js**.


## Contribution ##

If you happen to know how to write JavaScript, documentation or can help out with something else, drop us a note at *contact at swordlord dot com*. As more helping hands we have, as quicker this server gets up and feature complete.

If some feature is missing, just remember that this is an Open Source Project. If you need something, think about contributing it yourself...


## Dependencies ##

For now, have a look at the package.json file.

If you:
- run the test cases, make sure that you installed the dev dependencies...
- use the LDAP authentication method, make sure to install ldapjs@1.0.0 node module with "npm install ldapjs@1.0.0".

## License ##

**Fennel.js** is published under the GNU Affero General Public Licence version 3. See the LICENCE file for details.