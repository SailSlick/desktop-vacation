# Syncing API

All of the following requests require the user to be authenticated.

### [General Information](./README.md)


## POST /image/upload

Upload an array of images to the server

### Request

*MIME Type*: `multipart/form-data`

#### JSON Parameters

| Name       | Type   | Description                                             |
|------------|--------|---------------------------------------------------------|
| images     | Array  | Image files to be uploaded                              |
| metadatas  | Array  | Image's respective [metadata (object)](../db/images.md) |
| hashes     | Array  | Image's respective hashes (string)                      |
| gid        | String | Serverside ID of target gallery                         |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

The `image-ids` key refers to the reference the server has for the image. The
response array imitates the original file order: the first image uploaded is
the first image_id in the array and so on.

```json
{
  "message": "images uploaded",
  "image-ids": [image_id_0, ..., image_id_n]
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'upload failed'`         |   403  |
| `'gallery doesn't exist'` |   404  |


## POST /image/update

Update metadata of an image

### Request

*MIME Type*: `application/json`

#### JSON Parameters

| Name       | Type   | Description                                |
|------------|--------|--------------------------------------------|
| id         | String | Serverside ID of the image                 |
| metadata   | Object | Image's [metadata](../db/images.md)        |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```json
{
  "message": "image updated"
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'update failed'`         |   403  |
| `'gallery doesn't exist'` |   404  |


## GET /image/<id:string>

Return the image with `<id>`

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                |
|------------|-----------|----------------------------|
| id         | String    | Serverside ID of the image |

### Response

*MIME Type*: `image/*` (`*` will be some image type)

*Response Code*: `200 OK`

```
<image_data>
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'image doesn't exist'`   |   404  |
| `'upload failed'`         |   500  |


## POST /image/<id:string>/remove/<gid:string>

Remove the image with `<id>` from the gallery `<gid>`

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                     |
|------------|-----------|---------------------------------|
| id         | String    | Serverside ID of the image      |
| gid        | String    | Serverside ID of target gallery |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```json
{
  "message": "image deleted"
}
```

#### Expected Errors

| Error Message                             | Status |
|-------------------------------------------|--------|
| `'invalid image id'`                      |   400  |
| `'cannot find image'`                     |   400  |
| `'invalid permissions'`                   |   401  |
| `'invalid gallery transaction'`           |   500  |


## POST /image/<id:string>/share

Publicise the image with `<id>`

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                |
|------------|-----------|----------------------------|
| id         | String    | Serverside ID of the image |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```json
{
  "message": "image shared"
}
```

#### Expected Errors

| Error Message               | Status |
|-----------------------------|--------|
| `'invalid image id'`        |   400  |
| `'failure to share image'`  |   400  |


## POST /gallery/upload

Upload/update a gallery on the server

### Request

*MIME Type*: `application/json`

#### JSON Parameters

| Name       | Type      | Description                            |
|------------|-----------|----------------------------------------|
| gallery    | Object    | [Gallery document](../db/galleries.md) |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```json
{
  "message": "gallery added",
  "gid": "2g6c2b97bac0595474108b48"
}
```

#### Expected Errors

| Error Message               | Status |
|-----------------------------|--------|
| `'invalid gallery'`         |   400  |
| `'failed to add gallery'`   |   500  |

## GET /gallery/<gid:string>

Returns the associated gallery document from the database.

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                  |
|------------|-----------|------------------------------|
| gid        | String    | Serverside ID of the gallery |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

Refer to the [db spec](../galleries.md) for more information on this response.

```json
{
  "status": 200,
  "message": "gallery found",
  "data": {
    "_id": "58c1639bbc15aa11fcceddf8",
    "name": "Sully_all",
    "uid": "58c1639bbc15aa11fcceddf7",
    "users": [],
    "tags": [],
    "subgallaries": [
      "58c163a6bc15aa11fcceddf9"
    ],
    "images": [
      "58c163e3bc15aa11fcceddfa",
      "58c163e4bc15aa11fcceddfd"
    ]
  }
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'invalid gid'`           |   400  |
| `'gallery doesn't exist'` |   404  |

## POST /gallery/<gid:string>/remove

Remove the associated gallery document from the database.

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                  |
|------------|-----------|------------------------------|
| gid        | String    | Serverside ID of the gallery |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```json
{
  "message": "image removed"
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'invalid gid'`           |   400  |
| `'gallery doesn't exist'` |   404  |
