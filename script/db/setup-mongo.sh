#!/bin/bash

# Must be run from project root
# change the default conf
VDIR=`pwd`
echo VDIR

# add a user to mongo
cd hidden/mongo
mongo create-mongo-user.js

# update the conf file
sudo mv /etc/mongod.conf /etc/mongod.conf.orig
sudo cp ${VDIR}/script/db/mongod.conf /etc/mongod.conf

# make ssl cert for mongo
sudo mkdir /etc/ssl/mongodb/
sudo cp ${VDIR}/hidden/mongo/ssl-pw-client /etc/ssl/mongodb/ssl-pw-client
sudo cp ${VDIR}/hidden/mongo/ssl-pw-server /etc/ssl/mongodb/ssl-pw-server

cd ../../server
npm run populate-db

cd /etc/ssl/mongodb/
# Server
sudo openssl req -new -x509 -days 365 -out mongodb-server-cert.crt \
-keyout mongodb-server-cert.key -passout pass:ssl-pw-server \
-subj "/C=IE/ST=Dublin/L=9/O=CPSSD"
sudo bash -c 'cat mongodb-server-cert.key mongodb-server-cert.crt > mongodb-server.pem'

# Client
sudo openssl req -new -x509 -days 365 -out mongodb-client-cert.crt \
-keyout mongodb-client-cert.key -passout pass:/etc/ssl/mongodb/ssl-pw-client \
-subj "/C=IE/ST=Dublin/L=9/O=CPSSD"
sudo bash -c 'cat mongodb-client-cert.key mongodb-client-cert.crt > mongodb-client.pem'

sudo service mongod restart
