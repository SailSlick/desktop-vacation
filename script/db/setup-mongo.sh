#!/bin/bash

if [ $# -ne 4 ]; then
	echo "Insufficient arguments"
	exit 1
fi

# Must be run from project root
# Change the directory
BASEDIR=$(pwd)
cd script/db

# Load the MongoDB Database password
USERNAME=$1
PASSWORD=$2
SSL_CLI=$3
SSL_SRV=$4

# Make sure mongo is running
sudo systemctl restart mongod
# Sleep until it is ready
sleep 2

# Add a user to mongo
sed "s/PASSWORDHERE/$PASSWORD/g" create-mongo-user.js > /tmp/setup_user.js
sed "s/USERNAMEHERE/$USERNAME/g" /tmp/setup_user.js > /tmp/setup.js
mongo /tmp/setup.js
if [ $? -ne 0 ]; then
  echo "WARNING: Mongo already set up or not running"
fi
rm /tmp/setup.js
rm /tmp/setup_user.js

# Update connection string
sed "s/PASSWORDHERE/$PASSWORD/g" mongo-url-template.js > /tmp/conn_str.js
sed "s/USERNAMEHERE/$USERNAME/g" /tmp/conn_str.js > mongo-url.js
rm /tmp/conn_str.js

# update the conf file
sudo mv /etc/mongod.conf /etc/mongod.conf.orig
sudo cp mongod.conf /etc/mongod.conf

sudo systemctl restart mongod
# Sleep until it is ready
sleep 2

cd "$BASEDIR/server"
npm run populate-db

# make ssl cert for mongo
sudo mkdir -p /etc/ssl/mongodb/
cd /etc/ssl/mongodb/
sudo su -c "echo '$SSL_CLI' > ssl-pw-client"
sudo su -c "echo '$SSL_SRV' > ssl-pw-server"

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

sudo systemctl restart mongod
sudo systemctl enable mongod

exit 0
