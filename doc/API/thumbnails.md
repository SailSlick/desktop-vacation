# Thumbnails API

### [General Information](./README.md)

## Sizes

Names are based on Bootstrap column size conventions.

Dimensions are given in pixels.

| Name | Width | Height |
|------|-------|--------|
| sm   | 150   | 150    |
| md   | 350   | 350    |
| lg   | 500   | 500    |
| xl   | 1200  | 1200   |

These sizes are based off popular social media sites' recommendations
and the Open Graph API, as well as our own needs.

- Twitter:
	- At least 440x220px
	- Collapsed in steam at 506x253px
	- Max 1024x512px
- Facebook/OpenGraph:
	- At least 484x252px on page (scales up)
	- Recommended 1200x630px
- Desktop Vacation:
    - Up to 400px wide on screens < 1200px wide
	- At least 300px wide on screens >= 1200px wide

## Crop Styles

| Name  | Description                            | Aspect Ratio |
|-------|----------------------------------------|--------------|
| fit   | Squeeze/Stretch appropriately          | Square       |
| fill  | Fill container by overflowing x/y axis | Dynamic      |
| growx | Fix height, scale width                | Dynamic      |
| growy | Fix width, scale height                | Dynamic      |

## Usage

### Query

`GET /images/<image_id>/thumb[/<size>/<cropping>]`

**Example**

`GET /images/6160f58eacb/thumb/sm/fit`

Defaults for `size` and `cropping` are `lg` and `growy` respectively.

Note that if size is specified, cropping must also be specified.

### Response

`Status: 200 OK`

An image of MIME type `image/jpeg`. This can be fed directly into img elements.

### Expected Errors

Error messages are `text/json`

| Error Message          | Status |
|------------------------|--------|
| `'invalid parameters'` |   400  |
| `'image not found'`    |   404  |
| `'generation failed'`  |   500  |
