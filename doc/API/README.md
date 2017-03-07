# API General Information

## URL Parameters

`<id:string>` denotes a URL containing an `id` parameter of type `string`.
It is a required argument.

`g/[thumbnail]` denotes a fixed optional value. For instance, the url
`/g/thumbnail` or `/g` would both be fine.

This can sometimes greatly help to reduce API complexity.

## Request Parameters

The API uses the MIME type `application/json` for both parameters and response
unless otherwise noted, as in the case for images.

## Status codes

| Code | Text           | Description                     |
|------|----------------|---------------------------------|
| 200  | OK             | Operation succeeded             |
| 400  | Bad Request    | The request was malformed. See `error` in the response for details |
| 401  | Unauthorized   | Missing or incorect session_key |
| 404  | Not Found      | The url seems to be incorrect   |
| 500  | Internal Error | The server made a mistake       |

## Errors

If an error occurs, a string describing it will be in the `error` field in the
JSON response. For example:

```
Status: 404 Not Found
```
```json
{
  "error": "gallery doesn't exist"
}
```
