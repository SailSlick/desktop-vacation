# Desktop Vacation Server

All the following commands should be run from the `server` folder

# Dependencies Table

|         Name           | Environment |              Purpose               |
|------------------------|-------------|------------------------------------|
| mongodb                | production  | NoSQL database                     |
| connect-mongo          | production  | Mongo session store for express    |
| express                | production  | Web framework                      |
| mkdirp                 | production  | Recursive make directory           |
| debug                  | production  | Provides better logging utilities  |
| body-parser            | production  | Converts requests to correct format|
| bcrypt                 | production  | Provides secure password hashing   |
| multer                 | production  | Handles multipart/form uploads     |
| multer-gridfs-storage  | production  | Allow gridfs storage with multer   |
| joi                    | production  | Validates object structures        |
| eslint                 | dev         | Javascript style guide             |
| chai                   | dev         | Testing library                    |
| chai-http              | dev         | Module for chai for http requests  |
| mocha                  | dev         | Unit testing suite                 |
| mocha-jenkins-reporter | dev         | Compiles Jenkins-friendly reports  |
| nyc                    | dev         | Istanbul Coverage CLI              |
| stdio-mock             | dev         | Fake read/write streams            |

# Installation

```bash
npm install
```

# Testing

```bash
npm run lint			 # Lint code (produces XML file)
npm test                 # Unit tests
npm run coverage         # Show unit test coverage
npm run populate-db      # Populate mongo with sample data
```
