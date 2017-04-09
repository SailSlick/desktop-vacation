# Groups API.

All of the following requests require the user to be authenticated.

### [General Information](./README.md)

## Create Group

`POST /group/create`

Upon successful request, creates a new group gallery.

### Parameters

| Name      | Type   | Description                   |
|-----------|--------|-------------------------------|
| groupname | string | The name of the group to make |

### Response

` Status: 200 OK `
```json
{ "message": "group created" }
```

### Expected Errors

| Error Message                           | Status |
|-----------------------------------------|--------|
| `'creation failed'`                     |   500  |
| `'invalid groupname'`                   |   400  |
| `'user already has group of same name'` |   400  |
| `'gallery doesn't exist'`               |   404  |

## Switch Group

`POST /group/switch`

Upon successful request, turns a gallery into a group.

### Parameters

| Name      | Type   | Description                                |
|-----------|--------|--------------------------------------------|
| groupname | string | The name of the gallery to make into group |

### Response

` Status: 200 OK `
```json
{ "message": "gallery switched" }
```

### Expected Errors

| Error Message             | Status |
|---------------------------|--------|
| `'switch failed'`         |   500  |
| `'gallery doesn't exist'` |   404  |

## Delete Group

`POST /group/delete`

Upon successful request, deletes a group gallery.

### Parameters

| Name | Type   | Description                   |
|------|--------|-------------------------------|
| gid  | string | The id of the group to delete |

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
| `'invalid gid'`                     |   400  |

## Invite user to group

`POST /group/user/invite`

Upon successful request, invites a user to join the group.

### Parameters

| Name      | Type   | Description                 |
|-----------|--------|-----------------------------|
| gid       | string | The group id to invite to   |
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
| `'user is already member of group'` |   400  |

## Remove user from group

`POST /group/user/remove`

Upon successful request, removes a user from the group.

### Parameters

| Name      | Type   | Description                        |
|-----------|--------|------------------------------------|
| gid       | string | The id of the group to remove from |
| username  | string | The name of the user to remove     |

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

| Name      | Type   | Description                 |
|-----------|--------|-----------------------------|
| groupname | string | The group name to join      |
| gid       | string | The id of the group to join |

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

| Name      | Type   | Description                   |
|-----------|--------|-------------------------------|
| groupname | string | The group name of the invite  |
| gid       | string | The id of the group to refuse |

### Response

` Status: 200 OK `
```json
{ "message": "user has refused invitation" }
```

### Expected Errors

| Error Message                | Status |
|------------------------------|--------|
| `'invitation doesn't exist'` |   404  |

## Get all your Invites

`GET /group/user`

Upon successful request, returns a list of the user's invites to groups.

### Response

` Status: 200 OK `
```json
{
  "message": "user groups found",
  "data": [{
    "groupname": "funtimes",
    "gid": ObjectId("2g6c2b97bac0595474108b48")
  }]
}
```

## Get all your Groups

`GET /group/`

Upon successful request, returns a list of the user's group galleries.

### Response


## Get Group data

`GET /group/<gid>`

Upon successful request, returns all of the image/gallery data stored in the
group. if there is no gid it will return all the user's groups.

### Parameters

| Name | Type   | Description                   |
|------|--------|-------------------------------|
| gid  | string | The group id to get data from |

### Response

`/group/2g6c2b97bac0595474108b48`
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
    "subgalleries": [
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

`/group/`
` Status: 200 OK `
```json
{
  "message": "user groups found",
  "data": {
    "subgalleries": [{
      "_id": ObjectId("2g6c2b97bac0595474108b48"),
      "name": "scenery",
      "uid": ObjectId("542c2b97bac0595474108b48"),
      "users": ["m1cr0man","Sully"],
      "images": []
    }],
    "images": []
    }
}
```

### Expected Errors

| Error Message                  | Status |
|--------------------------------|--------|
| `'group doesn't exist'`        |   404  |
| `'user isn't member of group'` |   400  |

## Add images/galleries to group

`POST /group/data/add`

Upon successful request, adds images/galleries to a group.

### Parameters

| Name      | Type   | Description                   |
|-----------|--------|-------------------------------|
| gid       | string | The id of the group to update |
| image-ids | object | Array of image-ids to add     |

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

| Name      | Type   | Description                        |
|-----------|--------|------------------------------------|
| gid       | string | The id of the group to remove from |
| groupdata | object | The data to remove from the group  |

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
