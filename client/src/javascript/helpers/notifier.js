function sendEvent(type, headline, message) {
  document.dispatchEvent(new CustomEvent(
    'notify',
    { detail: {
      type,
      headline,
      message
    } }
  ));
}

export function success(message) {
  console.log(message);
  sendEvent('success', 'Success', message);
}

export function info(message) {
  console.info(message);
  sendEvent('info', 'Info', message);
}

export function warning(message) {
  console.warn(message);
  sendEvent('warning', 'Warning', message);
}

export function danger(message) {
  console.error(message);
  sendEvent('danger', 'Error', message);
}

export default { success, info, warning, danger };
