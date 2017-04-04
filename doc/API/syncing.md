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

`image-ids` is a list of the serverside IDs for each image, in the order
they were uploaded.

```json
{
  "message": "images uploaded",
  "image-ids": ["58c163e4bc15aa11fcceddfd", "...", "58c163e4bc15aa11fe4bc1ad"]
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `bad image(s)`            |   400  |
| `not authorised`          |   401  |
| `upload failed`           |   500  |


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
| `not authorised`          |   401  |
| `image doesn't exist`     |   404  |
| `update failed`           |   500  |


## GET /image/(id:string)

Return the image with `<id>`

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                |
|------------|-----------|----------------------------|
| id         | String    | Serverside ID of the image |

### Response

*MIME Type*: `image/[some_image_type]`

*Response Code*: `200 OK`

```
<image_data>
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `not authorised`          |   401  |
| `image doesn't exist`     |   404  |


## GET /image/(id:string)/metadata

Return the metadata of the image with `<id>`

### Request

*MIME Type*: `text/plain`

#### URL Parameters

| Name       | Type      | Description                |
|------------|-----------|----------------------------|
| id         | String    | Serverside ID of the image |

### Response

*MIME Type*: `application/json`

*Response Code*: `200 OK`

```
{
  "rating": 3,
  "tags": ["winter", "chill"]
}
```

#### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `not authorised`          |   401  |
| `image doesn't exist`     |   404  |


## POST /image/(id:string)/remove/(gid:string)

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
| `not authorised`                          |   401  |
| `image doesn't exist`                     |   404  |
| `gallery doesn't exist`                   |   404  |
| `failed to delete image`                  |   500  |


## POST /image/(id:string)/share

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
| `not authorised`            |   401  |
| `image doesn't exist`       |   404  |
| `failed to share image`     |   500  |


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
  "message": "gallery uploaded",
  "gid": "2g6c2b97bac0595474108b48"
}
```

#### Expected Errors

| Error Message               | Status |
|-----------------------------|--------|
| `invalid gallery object`    |   400  |
| `not authorised`            |   401  |
| `upload failed`             |   500  |

## GET /gallery/(gid:string)

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

Refer to the [db spec](../db/galleries.md) for more information on this response.

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
| `not authorised`          |   401  |
| `gallery doesn't exist`   |   404  |

## POST /gallery/(gid:string)/remove

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
  "message": "gallery removed"
}
```

#### Expected Errors

| Error Message              | Status |
|----------------------------|--------|
| `not authorised`           |   401  |
| `gallery doesn't exist`    |   404  |
| `failed to delete gallery` |   500  |
