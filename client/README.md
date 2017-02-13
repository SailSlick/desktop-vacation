# Client

All the following commands should be run from the `client` folder

# Dependencies Table

|         Name         | Environment |              Purpose             |
|----------------------|-------------|----------------------------------|
| bootstrap            | production  | CSS styling                      |
| tether               | production  | Bootstrap dependency             |
| jquery               | production  | Javascript DOM manipulation      |
| fs-jetpack           | production  | Ease of use FS API               |
| mustache             | production  | Simple templating engine         |
| chai                 | dev         | Lovely testing library           |
| chai-as-promised     | dev         | Promise support for chai         |
| electron             | dev         | API for building desktop webapps |
| electron-builder     | dev         | Compile electron app for distro. |
| gulp                 | dev         | Task manager                     |
| istanbul             | dev         | Code coverage reporter           |
| minimist             | dev         | Arguments parser                 |
| mocha                | dev         | Unit testing suite               |
| rollup               | dev         | Minifier and compiler for ES     |
| source-map-support   | dev         | Improves stack tracing           |
| spectron             | dev         | E2E testing suite                |

# Installation

```bash
npm install
```

# Running

```bash
npm start
```

# Testing

```bash
npm test         # Unit tests
npm run e2e      # E2E tests
npm run coverage # Coverage reports for the unit tests
```