# API

The API uses the MIME type `application/json` for both parameters and response
unless otherwise noted, as in the case for images.

**Version:** 0.1.1

## Status codes

| Code | Text           | Description                     |
|------|----------------|---------------------------------|
| 200  | OK             | Operation succeeded             |
| 400  | Bad Request    | The request was malformed. See `error` in the response for details |
| 401  | Unauthorized   | Missing or incorect session_key |
| 404  | Not Found      | The url seems to be incorrect   |
| 500  | Internal Error | The server made a mistake       |

## Errors

If an error occurs, a string describing it will be in the error field in the
json.

## User Login

`POST /user/login`

Upon successful request, logs a user in.

### Parameters

| Name      | Type   | Description                              |
|-----------|--------|------------------------------------------|
| user      | string | the username of the user                 |
| password  | string | the password the user                    |

### Responses

```
Status: 200 OK
```
```json
{
  "message": "user logged in"
}
```

### Expected Errors

| Error Message                   | Status |
|---------------------------------|--------|
| `'incorrect credentials'`       | 401    |

## Create user

`POST /user/create`

Upon successful request, creates a new user and logs them in. Login is managed
by `express-session`, and it will leave a cookie which corresponds to a database
entry.

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
  "message": "user created and logged in"
}
```

### Expected Errors

| Error Message                     | Status |
|-----------------------------------|--------|
| `'invalid username'`              | 400    |
| `'invalid password'`              | 400    |
| `'invalid username and password'` | 400    |
| `'username taken'`                | 400    |

## User Logout

`POST /user/logout`

Upon successful request, logs user out. User must be logged in.

### Response

```
Status: 200 OK
```
```json
{
  "message": "user logged out"
}
```

## User Update

`POST /user/update`

Upon successful request, updates users settings. For now, this only encompasses
passwords, but as more settings get added they will be modified via. this
request.

### Parameters

| Name         | Type   | Description                              |
|--------------|--------|------------------------------------------|
| password     | string |  the password for the user.              |

### Response

```
Status: 200 OK
```
```json
{
  "message": "user updated"
}
```

### Expected Errors

| Error Message                     | Status |
|-----------------------------------|--------|
| `'no data changed'`               | 400    |
| `'invalid password'`              | 400    |


## User Delete

`POST /user/delete`


Upon successful request, deletes the users account. They must be logged in.

### Response

```
Status: 200 OK
```
```json
{
  "message": "user deleted"
}
```
