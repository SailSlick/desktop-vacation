# Syncing API

All of the following requests require the user to be authenticated.

### [General Information](./README.md)

## Uploading

`POST /gallery/sync`

Upon successful request, will upload the send image(s) to the server.

### Parameters

#### MIME Type

Since images are being sent to the database, the request can't simple be
`application/json`. We settled on `multipart/form-data` as it's the standard
in these types of image uploading scenarios.

| Name       | Type                 | Description                         |
|------------|----------------------|-------------------------------------|
| images     | array of form images | a set of the uploaded images        |
| gallery-id | string               | a reference to the mongo gallery id |

### Response

The `image-id` key refers to the reference the server has for the image. The
response array imitates the original file order, so the first image uploaded is
the first image_id in the array, and so on.

`Status: 200 OK`
```
{
  "message": "images uploaded",
  "image-id": [<image_id_0>, ..., <image_id_n>]
}
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'upload failed'`         |   500  |
| `'gallery doesn't exist'` |   404  |

## Downloading images

`GET /image/<image-id:string>/(thumbnail)?`

Downloads an image. The thumbnail argument is optional and if included will
return a smaller version of the image.

### URL Parameters

| Name       | Type        | Description                                   |
|------------|-------------|-----------------------------------------------|
| image-id   | string      | a string referencing image's id on the server |

### Response

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

`GET /gallery/<gallery-id:string>/(thumbnail)?`

Returns a list of images in the gallery.

The thumbnail arument is optional and if included will add `/thumbnail` to the
image requests.

### URL Parameters

| Name       | Type      | Description                                       |
|------------|-----------|---------------------------------------------------|
| gallery-id | string    | a string referencing a gallery's id on the server |

### Response

The `images` field is a list of __relative__ image urls in the gallery,

`Status: 200 OK`
```json
{
  "message": "gallery found",
  "images": ["/url/1", "/url/...", "/url/N"]
}
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'gallery doesn't exist'` |   404  |
