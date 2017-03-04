# Desktop Vacation Client
Electron-based cross platform frontend. Allows users to manage their
background collection on their computer.

All the following commands should be run from the `client` folder

# Dependencies Table

|         Name            | Environment |              Purpose             |
|-------------------------|-------------|----------------------------------|
| async                   | production  | Better handling of async tasks   |
| bootstrap               | production  | CSS styling                      |
| electron                | production  | API for building desktop webapps |
| fs-jetpack              | production  | Ease of use FS API               |
| lokijs                  | production  | In-memory database               |
| react-dom               | production  | Apply components to the DOM      |
| react-bootstrap         | production  | React components for B.S items   |
| chai                    | dev         | Lovely testing library           |
| chai-as-promised        | dev         | Promise support for chai         |
| chai-enzyme             | dev         | Test React VDOM inside chai      |
| chai-things             | dev         | Assertions for iterables         |
| electron-builder        | dev         | Compile electron app for distro. |
| electron-mocha          | dev         | Test electron without a human    |
| electron-react-devtools | dev         | Inspect element for VDOM         |
| enzyme                  | dev         | Assertions for React Components  |
| eslint                  | dev         | Code style checker               |
| istanbul                | dev         | Code coverage reporter           |
| minimist                | dev         | Arguments parser                 |
| mocha                   | dev         | Unit testing suite               |
| mocha-jenkins-reporter  | dev         | Compiles Jenkins-friendly report |
| react                   | dev         | Component based dom manipulation |
| rollup                  | dev         | Minifier and compiler for ES     |
| sinon                   | dev         | Spies, stupds and mocks          |
| source-map-support      | dev         | Improves stack tracing           |
| spectron                | dev         | E2E testing suite                |
| xvfb-maybe              | dev         | Creates virtual X framebuffer    |

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
npm test             # Unit tests
npm run lint         # Lint src folder (produces XML file)
npm run e2e          # E2E tests
npm run coverage     # Coverage reports for the unit tests
npm run coverage-all # Merge client and server cov reports
```
