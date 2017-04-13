# Syncing API

All of the following requests require the user to be authenticated.

### [General Information](./README.md)


## POST /image/upload

Upload an array of images to the server

### Request

*MIME Type*: `multipart/form-data`

#### JSON Parameters

| Name       | Type   | Description                                                                   |
|------------|--------|-------------------------------------------------------------------------------|
| images     | Array  | Image files to be uploaded                                                    |
| metadatas  | String | JSON encoded array of image's respective [metadata (object)](../db/images.md) |
| hashes     | Array  | Image's respective hashes (string)                                            |

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
| `no images to upload`     |   200  |
| `invalid request`         |   400  |
| `not logged in`           |   401  |
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
| `not logged in`           |   401  |
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
| `not logged in`           |   401  |
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
| `not logged in`           |   401  |
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
| `not logged in`                           |   401  |
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
| `not logged in`             |   401  |
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

| Error Message                        | Status |
|--------------------------------------|--------|
| `gallery not updated`                |   302  |
| `invalid gallery object`             |   400  |
| `uid of gallery does not match user` |   401  |
| `incorrect permissions`              |   403  |
| `gallery doesn't exist`              |   404  |
| `gallery could not be inserted`      |   500  |

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
| `invalid gid`             |   400  |
| `not logged in`           |   401  |
| `incorrect permissions`   |   403  |
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
| `invalid gid`              |   400  |
| `not logged in`            |   401  |
| `incorrect permissions`    |   403  |
| `gallery doesn't exist`    |   404  |
| `failed to remove gallery` |   500  |


# Clientside Syncing Protocol

It's important to note that the handling of ref counters
is invisible to the client.

## Image Syncing

- Select as many images as possibles to sync
  - Only those without a remoteId are synced
- Upload and map the response id to remoteId for each image

## Gallery Syncing

- Download gallery data from server
  - If it doesn't 404:
    - Remove images/subgalleries as appropriate from client
    - Download new images/subgalleries
- Get list of unsynced images
  - Follow protocol to sync these
- Get list of unsynced subgalleries
  - Follow this procedure (recurse)
- If user removed something explicitly:
  - Make sure the changed data is sent to the server
- Upload gallery data to server
  - Server will handle removing images/subgalleries itself

## Image Unsyncing

- Send remove request to server
- If it's successful:
  - Delete cached thumbnails
  - Perform other tasks (did user want to delete from disk?)
- Inform user of the outcome
  - If doing > 1 delete, wait until they are all done

## Gallery Unsyncing

- Send remove request to server
  - Server will handle removing images
- If it's successful:
  - Remove from client & remove subgallery ties
- Inform user of the outcome


# Serverside Syncing Protocol

## Image Syncing

- For each image uploaded:
  - Add image to FS
    - Grab ID of existing images (with the same hash)
    - Increment/set ref counter of image-fs doc
  - Add image to our collection
    - Save metadata, owner, hash, etc here
    - Set ref counter to 1 in image doc
  - Add id to the response id array
- Return array of serverside ids to the client

## Gallery Syncing

- Add gallery to our collection
- For each image added/removed:
  - Increase/decrease its ref counter

## Image Unsyncing

- Decrement ref counter in image collection
  - If ref counter is 0:
    - Decrement ref counter in FS
    - If FS ref counter is 0:
      - Remove from FS too
    - Remove from collection

## Gallery Unsyncing

- For each image:
  - Follow above protocol to unsync
- For each subgallery:
  - Follow this procedure (recurse)
- Remove from collection
