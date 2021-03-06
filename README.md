# Desktop Vacation

[![Build Status](http://jenkins.m1cr0man.com/job/Desktop%20Vacation/job/master/badge/icon)](http://jenkins.m1cr0man.com/job/Desktop%20Vacation/job/master/)

“Desktop Vacation is an application suite to manage your backgrounds with a cloud storage service and social options.”

Written by The Arduous Aaron, The Lucrative Lucas and The Rickety Ross

### Current Features
- [x] We have a repo (with readmes and all) :)
- [x] User friendly UI
- [x] Ability to change background on supported platforms
- [x] Customisable slideshow feature
- [x] Organise backgrounds into galleries
- [x] Very portable client-side database
- [x] Sync backgrounds to the cloud
- [x] Sync galleries to the cloud
- [x] Image comparison to not store duplicates on server
- [x] Share backgrounds across social groups
- [x] Share backgrounds using links

### Planned Features
- [ ] Share backgrounds peer to peer

### Installation
```bash
cd client
npm install
npm run makeDb

cd ../server
npm install
cd ..

script/db/setup-mongo.sh <USERNAME> <PASSWORD> <SSL_CLI_PASSWORD> <SSL_SRV_PASSWORD>
```

### Other Documentation
- [Server](./server/#desktop-vacation-server)
- [Client](./client/#desktop-vacation-client)
- [Design doc](./doc/#desktop-vacation-specs)
