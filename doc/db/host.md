# Database for Host Data

The Host database holds the personal settings and username for the host
machine.

Contains
-------------
| Field | Description|
|-------|------------|
| username | The Username of the user. |
| gallery | A doc id for the host's root gallery in the gallerydb  |
| config | The user's config for the app. |

Example Document
----------------
```js
{
  "username" : "testuser" ,
  "gallery" : ObjectId("sj478b97bac0595474108b48"),
  "slideshowConfig" : {
    "onstart": true ,
    "galleryName": "",
    "timer": 30
  }
}
```
