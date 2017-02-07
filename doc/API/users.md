# API

The API uses the MIME type `application/json` for both parameters and response
unless otherwise noted, as in the case for images.

**Version:** 0.1.0

The version will be included in all responses.x

## Status codes

| Code | Text           | Description                     |
|------|----------------|---------------------------------|
| 200  | OK             | Operation succeeded             |
| 400  | Bad Request    | The request was malformed. See `error` in the response for details |
| 401  | Unauthorized   | Missing or incorect session_key |
| 404  | Not Found      | The url seems to be incorrect   |
| 500  | Internal Error | The server made a mistake       |


## User Login

`POST /user/login`

Upon successful request, logs a user in.

### Parameters

| Name      | Type   | Description                              |
|-----------|--------|------------------------------------------|
| user      | string | the username or the email of the user    |
| password  | string | the password the user entered            |

### Response

| Name        | Type   | Description                              |
|-------------|--------|------------------------------------------|
| session_key | string | A key that you'll need to pass into ever API request that requires authentication |

```
Status: 200 OK
```
```json
{
  "session_key": "super_secret_key"
}
```

## Create user

`POST /user/create`

Upon successful request, creates a new user.

### Parameters

| Name      | Type   | Description                              |
|-----------|--------|------------------------------------------|
| username  | string | the username of the user                 |
| email     | string | the email of the user                    |
| password  | string | the password the user entered            |

### Response

```
Status: 200 OK
```
```json
{
  "session_key": "super_secret_key_hunter7"
}
```

| Name        | Type   | Description                              |
|-------------|--------|------------------------------------------|
| session_key | string | A key that you'll need to pass into ever API request that requires authentication |

## User Logout

`POST /user/logout`

Upon successful request, logs user out.

### Parameters

| Name         | Type   | Description                              |
|--------------|--------|------------------------------------------|
| session_key  | string | the current session_key for the user     |

### Response

```
Status: 200 OK
```

## User Update

`POST /user/update`

Upon successful request, updates users credentials.

### Parameters

| Name         | Type   | Description                              |
|--------------|--------|------------------------------------------|
| session_key  | string | the current session_key for the user     |
| email        | string | *OPTIONAL*: the new email for the user.  |
| password     | string | *OPTIONAL*: the password for the user.   |

### Response

```
Status: 200 OK
```

## User Delete

`POST /user/delete`


Upon successful request, logs user out and deletes their account.

### Parameters

| Name         | Type   | Description                              |
|--------------|--------|------------------------------------------|
| session_key  | string | the current session_key for the user     |

### Response

```
Status: 200 OK
```
