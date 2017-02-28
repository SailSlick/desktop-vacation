// All includes from src should be done here
import React from 'react';
import ReactDOM from 'react-dom';
import DevTools from 'electron-react-devtools';
import Main from './javascript/views/main.jsx';

// Store number of pending events for application loading
let waiting_events = 1;
const ready_event = new Event('vacation_loaded');

// Determine if application is fully loaded
function checkIfLoaded() {
  waiting_events -= 1;
  if (waiting_events === 0) {
    console.log('Application loaded');

    document.dispatchEvent(ready_event);
  }
}

DevTools.install();

// Events
document.addEventListener('database_loaded', checkIfLoaded, false);
document.addEventListener('vacation_loaded', _ =>
  ReactDOM.render(React.createElement(Main), document.getElementById('react-content')),
false);
