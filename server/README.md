# Desktop Vacation Server

All the following commands should be run from the `server` folder

# Dependencies Table

|         Name         | Environment |              Purpose               |
|----------------------|-------------|------------------------------------|
| mongodb              | production  | NoSQL database                     |
| connect-mongo        | production  | Mongo session store for express    |
| express              | production  | Web framework                      |
| debug                | production  | Provides better logging utilities  |
| body-parser          | production  | Converts requests to correct format|
| bcrypt               | production  | Provides secure password hashing   |
| eslint               | dev         | Javascript style guide             |
| chai                 | dev         | Testing library                    |
| chai-http            | dev         | Module for chai for http requests  |
| mocha                | dev         | Unit testing suite                 |

# Installation

```bash
npm install
```

# Testing

```bash
npm run test             # Unit tests
npm run populate-db      # Populate mongo with sample data
```
