# API General Information

## URL Parameters

When you see `<id:string>` in a URL, it tells you the URL has a constituent that
is a parameter named `id` of type `string`. It is a required argument.

A constituent labelled `g/(thumbnail)?` describes a fixed optional value.
For instance, the url `/g/thumbnail` or `/g` would be valid in this case.

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
