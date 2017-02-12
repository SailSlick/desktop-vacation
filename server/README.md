# Client

All the following commands should be run from the `client` folder

# Dependencies Table

|         Name         | Environment |              Purpose             |
|----------------------|-------------|----------------------------------|
| mongodb              | production  | NoSQL database                   |
| connect-mongo        | production  | Mongo session store for express  |
| express              | production  | Web framework                    |
| eslint               | dev         | Javascript style guide           |
| chai                 | dev         | Testing library                  |
| mocha                | dev         | Unit testing suite               |

# Installation

```bash
npm install
```

# Testing

```bash
npm run test             # Unit tests
npm run populate-db      # Populate mongo with sample data
```
