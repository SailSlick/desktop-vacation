// All includes from src should be done here
import $ from 'jquery';
import Images from './javascript/images';
import Slides from './javascript/slideshow-client';

// Link DOM events to functions
$('#btn-view-images').click(Images.view);
$('#btn-add-images').click(Images.getNew);
$('#btn-add-slideshow').click(() => Slides.setSlideshow());
$('#btn-clear-slideshow').click(Slides.clearSlideshow);
