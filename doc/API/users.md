# Users API

### [General Information](./README.md)

## User Login

`POST /user/login`

Upon successful request, logs a user in.

### Parameters

| Name      | Type   | Description                              |
|-----------|--------|------------------------------------------|
| user      | string | the username of the user                 |
| password  | string | the password the user                    |

### Responses

The gallery field is the user's base gallery on the server.

```
Status: 200 OK
```
```json
{
  "message": "user logged in",
  "gallery": "58c1639bbc15aa11fcceddf8"
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
  "message": "user created and logged in",
  "gallery": "58c1639bbc15aa11fcceddf8"
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
