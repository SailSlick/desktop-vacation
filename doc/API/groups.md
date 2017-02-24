# API

The API uses the MIME type `application/json` for both parameters and response
unless otherwise noted, as in the case for images.
- All of the following requests require the user to be authenticated.

### [Status codes](./users.md#status-codes)

### Errors

If an error occurs, a string describing it will be in the error field in the
json.

## Create Group

`POST /group/create`

Upon successful request, creates a new group gallery.

### Parameters

| Name      | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| groupname | string | The name of the gallery to make into group |

### Response

` Status: 200 OK `
```json
{ "message": "group created" }
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'creation failed'`       |   500  |
| `'invalid groupname'`     |   400  |
| `'gallery doesn't exist'` |   404  |

## Delete Group

`POST /group/delete`

Upon successful request, deletes a group gallery.

### Parameters

| Name      | Type   | Description                     |
|-----------|--------|---------------------------------|
| groupname | string | The name of the group to delete |

### Response

` Status: 200 OK `
```json
{ "message": "group deleted" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'deletion failed'`                 |   500  |
| `'group doesn't exist'`             |   404  |
| `'incorrect permissions for group'` |   401  |

## Get all your Groups

`GET /group/`

Upon successful request, returns a list of the user's group galleries.

### Response

` Status: 200 OK `
```json
{
  "message": "user groups found",
  "data": [{
    "_id": ObjectId("2g6c2b97bac0595474108b48"),
    "name": "scenery",
    "uid": ObjectId("542c2b97bac0595474108b48"),
    "users": ["m1cr0man","Sully"],
    "tags": ["blam"],
  }]
}
```

## Invite user to group

`POST /group/user/invite`

Upon successful request, invites a user to join the group.

### Parameters

| Name      | Type   | Description                 |
|-----------|--------|-----------------------------|
| groupname | string | The group name to invite to |
| username  | string | The name of the user to add |

### Response

` Status: 200 OK `
```json
{ "message": "user invited to group" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user doesn't exist'`              |   404  |
| `'incorrect permissions for group'` |   401  |

## Remove user from group

`POST /group/user/remove`

Upon successful request, removes a user from the group.

### Parameters

| Name      | Type   | Description                    |
|-----------|--------|--------------------------------|
| groupname | string | The group name to remove from  |
| username  | string | The name of the user to remove |

### Response

` Status: 200 OK `
```json
{ "message": "user removed from group" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user isn't member of group'`      |   400  |
| `'incorrect permissions for group'` |   401  |
| `'user is owner of group'`          |   400  |

## Join group

`POST /group/user/join`

Upon successful request, join a group that you have been invited to.

### Parameters

| Name      | Type   | Description            |
|-----------|--------|------------------------|
| groupname | string | The group name to join |

### Response

` Status: 200 OK `
```json
{ "message": "user has joined the group" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user is already member of group'` |   400  |
| `'user isn't invited to group'`     |   401  |

## Refuse invite to group

`POST /group/user/refuse`

Upon successful request, refuse an invitation you have received to a group.

### Parameters

| Name      | Type   | Description                  |
|-----------|--------|------------------------------|
| groupname | string | The group name of the invite |

### Response

` Status: 200 OK `
```json
{ "message": "user has refused invitation" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'invitation doesn't exist'`        |   404  |

## Get Group data

`GET /group/data`

Upon successful request, returns all of the image/gallery data stored in the
group.

### Parameters

| Name      | Type   | Description            |
|-----------|--------|------------------------|
| groupname | string | The group name to join |

### Response

` Status: 200 OK `
```json
{
  "message": "group found",
  "data": {
    "_id": ObjectId("2g6c2b97bac0595474108b48"),
    "name": "scenery",
    "uid": ObjectId("542c2b97bac0595474108b48"),
    "users": ["m1cr0man","Sully"],
    "tags": ["blam"],
    "subgallaries": [
      ObjectId("hk4c2b97bac0595474108b48"),
      ObjectId("2g6c2b97bac0595474108b48")
    ],
    "images": [
      ObjectId("542c2b97bac0595474138b48"),
      ObjectId("800c2b97bac0595474108b48"),
      ObjectId("fg6c2jghbac0595474108b48")
    ]
  }
}
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user isn't member of group'`      |   400  |

## Add images/galleries to group

`POST /group/data/add`

Upon successful request, adds images/galleries to a group.

### Parameters

| Name      | Type   | Description                  |
|-----------|--------|------------------------------|
| groupname | string | The group name to add to     |
| groupdata | object | The data to add to the group |

### Response

` Status: 200 OK `
```json
{ "message": "data added to group" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user isn't member of group'`      |   400  |
| `'data is invalid'`                 |   400  |
| `'incorrect permissions for group'` |   401  |

## Remove images/galleries from group

`POST /group/data/remove`

Upon successful request, removes images/galleries from a group.

### Parameters

| Name      | Type   | Description                       |
|-----------|--------|-----------------------------------|
| groupname | string | The group name to remove from     |
| groupdata | object | The data to remove from the group |

### Response

` Status: 200 OK `
```json
{ "message": "data removed from group" }
```

### Expected Errors

| Error Message                       | Status |
|-------------------------------------|--------|
| `'group doesn't exist'`             |   404  |
| `'user isn't member of group'`      |   400  |
| `'data is invalid'`                 |   400  |
| `'incorrect permissions for group'` |   401  |
