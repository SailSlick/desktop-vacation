# DB Information

## Server -> MongoDB
We decided to use [MongoDB](https://docs.mongodb.com/manual/introduction/),
a NOSQL database for this project for it's performance and the fact it's
open-sourced, well documented and has lovely drivers.

We use 3 different MongoDB collections for our server storage. The specs can
be found at the following links.
- [Users](/doc/db/users.md)
- [Galleries](/doc/db/galleries.md)
- [Images](/doc/db/Images)

## Client -> LokiJS
We decided to use [LokiJs](http://lokijs.org/#/), a javascript in-memory
database due to it's performance, documentation and active community

We use 3 different LokiJs collections for our client storage. The specs can be
found at the following links.
- [Host](/doc/db/host.md)
- [Galleries](/doc/db/galleries.md)
- [Images](/doc/db/Images)
