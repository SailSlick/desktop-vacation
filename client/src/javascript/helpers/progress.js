const progressFinishEvent = new Event('progress_finished');

export function updateProgressBar(size, message) {
  if (!message) message = '';
  document.dispatchEvent(new CustomEvent(
    'progress_update',
    { detail: { size, message } }
  ));
}

export function endProgressBar() {
  document.dispatchEvent(progressFinishEvent);
}

export default { updateProgressBar, endProgressBar };
