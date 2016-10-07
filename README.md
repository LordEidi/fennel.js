Fennel
======

![Fennel](https://raw.github.com/LordEidi/fennel/master/fennel_logo.png)

**Fennel** (c) 2014-16 by [SwordLord - the coding crew](http://www.swordlord.com/)

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

**Fennel** is tested on Calendar on iOS > v7.0 and on OSX Calendar as well as with Mozilla Lightning. If you run
**Fennel** with another client your mileage may vary.

What's missing:

- different clients (we will somewhen test with other clients, but we did not do thoroughly yet)


## Installation ##

First of all, you need a Node.js installation.

###nodejs on Debian###

Make sure that you have this line in your /etc/apt/sources.list file:

    deb http://YOURMIRROR.debian.org/debian jessie main

and then run:

    sudo apt-get install nodejs nodejs-legacy npm
    // eventually the next line as well
    // sudo ln -s /usr/lib/nodejs/ /usr/lib/node

###nodejs on OSX with homebrew###

    brew install node
    brew install npm

###Installation of **Fennel**###

If you want to run **Fennel** under a specific user (node), do this:

    sudo adduser node
    su node
    cd
    mkdir fennel
    cd fennel

Go into the directory where you want to run your copy of **Fennel** and get the latest and greatest:

    cd /home/node/fennel
    git clone https://github.com/LordEidi/fennel.git

And then with the magic of npm get the required libraries

    npm install

If everything worked according to plan, you should now have a new installation of the latest **Fennel**.

###Use supervisord to run **Fennel** as a service###

Now we want to make sure that **Fennel** runs forever. First install the required software:

    sudo apt-get install supervisor

Then copy the file utilities/fennel_supervisor.conf into your local supervisor configuration directory. This is usually done like this:
 
    cp utilities/fennel_supervisor.conf /etc/supervisor/conf.d/fennel.conf 
    
Make sure you change the configuration to your local setup.

###How to set up transport security###

Since **Fennel** does not bring it's own crypto, you may need to install a TLS server in front of **Fennel**. You can do so
with nginx, which is a lightweight http server and proxy.

First prepare your /etc/apt/sources.list file (or just install the standard Debian package, your choice):

    deb http://nginx.org/packages/debian/ jessie nginx
    deb-src http://nginx.org/packages/debian/ jessie nginx

Update apt-cache and install nginx to your system.

    sudo update
    sudo apt-get install nginx

Now configure a proxy configuration so that your instance of nginx will serve / prox the content of / for the
**Fennel** server. To do so, you will need a configuration along this example:

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

    https://mozilla.github.io/server-side-tls/ssl-config-generator/

Now run or reset your nginx and start your instance of **Fennel**.

Thats it, your instance of **Fennel** should run now. All logs are sent to stdout for now. Have a look at */libs/log.js* if
you want to change the options.

## Configuration ##

All parameters which can be configured right now are in the file *config.js*. There are not much parameters yet, indeed.
But **Fennel** is not ready production anyway. And you are welcome to help out in adding parameters and configuration
options.

### auth_method ###

The authentication method to use to authenticate users. Supported methods so far:

- courier: use a local courier authdaemon socket. You will need to fill in this config option as well: auth_method_courier_socket
- htaccess: use an htaccess file to authenticate the users. You will need to fill in this option as well: auth_method_htaccess_file

## How to run ##

Point your CalDAV and CardDAV client to the root of **Fennel**. All the rest should be managed by **Fennel** via
*./well-known* URLs and the chat between your client and **Fennel**.


## Test cases ##

There are a few test cases to check the working of **Fennel**. Make sure to

- run "npm install -g tape" to install needed dependencies.
- run an instance of **Fennel**.
- check your configuration, especially the test user and password.


## Contribution ##

If you happen to know how to write JavaScript, documentation or can help out with something else, drop us a note at *contact at swordlord dot com*. As more
helping hands we have, as quicker this server gets up and feature complete.


## Dependencies ##

For now, have a look at the package.json file.

If you run the test cases, make sure to first run "npm install -g tape".


## License ##

**Fennel** is published under the GNU General Public Licence version 3. See the LICENCE file for details.