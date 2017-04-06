# Images Filesystem Collection

Stores the files and their data in the MongoDB

## Document Structure

| Field        | Type     | Description                                            |
|--------------|----------|--------------------------------------------------------|
| _id          | String   | Generated sha1 hash for this image, provided by client |
| location     | String   | Path to file on disk                                   |
| refs         | Number   | Number of images referencing this file                 |
| size         | Number   | Size of file in bytes                                  |

## Example Document

```js
{
  "_id" : "5da00c42df15f3b4e6b724ca9b37659e",
  "filename" : "somefolder/2a6f5bfcc868b2db95661361e34ac24f.png",
  "refs" : 5,
  "size" : 261120
}
```
