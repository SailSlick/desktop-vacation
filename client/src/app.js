// All includes from src should be done here
import $ from 'jquery';
import Images from './javascript/images';
import Slides from './javascript/slideshow-client';
import Galleries from './javascript/galleries';

// Store number of pending events for application loading
let waiting_events = 2;
const ready_event = new Event('vacation_loaded');

// Determine if application is fully loaded
function checkIfLoaded() {
  waiting_events -= 1;
  if (waiting_events === 0) {
    console.log('Application loaded');
    document.dispatchEvent(ready_event);
  }
}

// Events
$(document).on('templates_loaded', checkIfLoaded);
$(document).on('database_loaded', checkIfLoaded);

// Link DOM events to functions
$('#btn-view-images').click(Images.view);
$('#btn-add-images').click(Images.getNew);
$('#btn-view-galleries').click(() => Galleries.view(''));
$('#btn-add-gallery').click(Galleries.addGalleryName);
$('#btn-add-slideshow').click(() => Slides.setSlideshow());
$('#btn-clear-slideshow').click(Slides.clearSlideshow);
