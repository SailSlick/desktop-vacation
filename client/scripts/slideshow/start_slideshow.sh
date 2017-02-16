##!/usr/bin/env bash

# make vacation a service
cp ./vacation.service /etc/systemd/system/vacation.service

systemctl start myapp
systemctl enable myapp
