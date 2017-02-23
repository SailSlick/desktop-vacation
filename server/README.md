# Client

All the following commands should be run from the `client` folder

# Dependencies Table

|         Name           | Environment |              Purpose               |
|------------------------|-------------|------------------------------------|
| mongodb                | production  | NoSQL database                     |
| connect-mongo          | production  | Mongo session store for express    |
| express                | production  | Web framework                      |
| debug                  | production  | Provides better logging utilities  |
| body-parser            | production  | Converts requests to correct format|
| bcrypt                 | production  | Provides secure password hashing   |
| eslint                 | dev         | Javascript style guide             |
| chai                   | dev         | Testing library                    |
| chai-http              | dev         | Module for chai for http requests  |
| mocha                  | dev         | Unit testing suite                 |
| mocha-jenkins-reporter | dev         | Compiles Jenkins-friendly reports  |
| nyc                    | dev         | Istanbul Coverage CLI              |

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
