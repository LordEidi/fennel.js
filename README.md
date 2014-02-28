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

**Fennel** is tested on Calendar on iOS > v7.0 and on OSX Calendar. If you run **Fennel** with another client
your mileage may vary. Mozilla Lightning - as example - still refuses to communicate with **Fennel**.

What's missing:

- password checks (while you can have multiple users, they are not really authenticated and accept all passwords)
- different clients (we will somewhen test with other clients, but we did not do thoroughly yet)


## Installation ##

First of all, you need a Node.js installation.

###nodejs on Debian###

Make sure that you have this line in your /etc/apt/sources.list file:

    deb http://YOURMIRROR.debian.org/debian wheezy-backports main

and then run:

    sudo apt-get install nodejs nodejs-legacy
    sudo ln -s /usr/lib/nodejs/ /usr/lib/node

then install the node package manager from source:

    curl https://www.npmjs.org/install.sh | sudo sh

###nodejs on OSX with homebrew###

    brew install nodejs

###Installation of **Fennel**###

If you run Debian stable, then this is a bit of a hassle. If you run Debian stable and only then (and know what you do)
update your glibc first to Debian testing. To do so, add this line to your /etc/apt/sources.list file (replacing the xxx part):

    deb http://ftp.xxx.debian.org/debian/ testing main

And then run the update:

    sudo update
    sudo apt-get -t testing install libc6-dev

Remove the testing line from your /etc/apt/sources.list file afterwards. Now follow the "normal" installation of **Fennel**.

If you want to run **Fennel** under a specific user (node), do this:

    sudo adduser node
    su node
    cd
    mkdir fennel
    cd fennel

Go into the directory where you want to run your copy of **Fennel** and install with the help of npm.

    cd /home/node/fennel
    npm install fennel@beta

If everything worked according to plan, you should now have a new installation of the latest **Fennel**.

Now we want to make sure that **Fennel** runs forever. First install this script globally:

    npm -g install forever

Then write the following lines into this file: /etc/init.d/fennel.

    #!/bin/sh
    #/etc/init.d/fennel

    export PATH=$PATH:/usr/local/bin
    export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules

    case "$1" in
      start)
        exec forever --sourceDir=/home/node/fennel/node_modules/fennel -p /home/node/fennel server.js
      ;;
      stop)
        exec forever stop --sourceDir=/home/node/fennel/node_modules/fennel server.js
      ;;
    *)
      echo "Usage: /etc/init.d/fennel {start|stop}"
      exit 1
      ;;
    esac

    exit 0

And make sure it is executable:

    sudo chmod 755 /etc/init.d/fennel

And make it come up automatically when booting the server:

    update-rc.d fennel defaults

Or stop the script from coming up with this command:

    update-rc.d -f fennel remove

Since **Fennel** does not bring it's own crypto, you may need to install a TLS server in front of **Fennel**. You can do so
with nginx, which is a lightweight http server and proxy.

First prepare your /etc/apt/sources.list file

    deb http://nginx.org/packages/debian/ wheezy nginx
    deb-src http://nginx.org/packages/debian/ wheezy nginx

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
        ssl_protocols  TLSv1;
        ssl_ciphers  ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+EXP;
        ssl_prefer_server_ciphers   on;
    }

Now run or reset your nginx and start your instance of **Fennel**.

Thats it, your instance of **Fennel** should run now. All logs are sent to stdout for now. Have a look at */libs/log.js* if
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