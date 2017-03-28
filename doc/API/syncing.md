# Syncing API

All of the following requests require the user to be authenticated.

### [General Information](./README.md)

## Uploading

`POST /gallery/upload`

Upon successful request, will upload the sent image(s) to the server.

### Parameters

#### MIME Type

Since images are being sent to the database, the request can't simply be
`application/json`. We settled on `multipart/form-data` as it's the standard
in these types of image uploading scenarios.

| Name       | Type                 | Description                         |
|------------|----------------------|-------------------------------------|
| images     | array of form images | a set of the uploaded images        |
| gid        | string               | a reference to the mongo gallery id |

### Response

The `image-ids` key refers to the reference the server has for the image. The
response array imitates the original file order: the first image uploaded is
the first image_id in the array and so on.

`Status: 200 OK`
```
{
  "message": "images uploaded",
  "image-ids": [<image_id_0>, ..., <image_id_n>]
}
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'upload failed'`         |   403  |
| `'gallery doesn't exist'` |   404  |

## Downloading images

`GET /image/<image-id:string>/`

Downloads an image given the image id.

### URL Parameters

| Name       | Type        | Description                                   |
|------------|-------------|-----------------------------------------------|
| image-id   | string      | a string referencing image's id on the server |

### Response

#### Note: this will be an image file, see Content-Type header for exact type.

`Status: 200 OK`
```
<image_data>
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'upload failed'`         |   500  |
| `'image doesn't exist'`   |   404  |

## Downloading galleries

`GET /gallery/<gid:string>/`

Returns the associated gallery information from the server database.

### URL Parameters

| Name       | Type      | Description                                       |
|------------|-----------|---------------------------------------------------|
| gid        | string    | a string referencing a gallery's id on the server |

### Response

Refer to the [db spec](../galleries.md) for more information on this response.

`Status: 200 OK`
```
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

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'invalid gid'`           |   400  |
| `'gallery doesn't exist'` |   404  |

## Removing Images Globally

`POST /image/<id:string>/remove`

Upon successful request, remove the image from the server and all galleries.

### URL Parameters

| Name       | Type      | Description                                       |
|------------|-----------|---------------------------------------------------|
| id         | string    | a string referencing an images's id on the server |

### Response

`Status: 200 OK`
```
{
  "message": "image deleted",
}
```

### Expected Errors

| Error Message                                 | Status |
|-----------------------------------------------|--------|
| `'invalid image id'`                          |   400  |
| `'cannot find image, or invalid permissions'` |   400  |
| `'invalid gallery transaction. please notify admin'` | 500 |
