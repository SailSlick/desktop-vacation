// All includes from src should be done here
import $ from 'jquery';
import Images from './javascript/images';
import Galleries from './javascript/galleries';

// Link DOM events to functions
$('#btn-view-images').click(Images.view);
$('#btn-add-images').click(Images.getNew);
$('#btn-view-galleries').click(Galleries.view);
$('#btn-add-gallery').click(Galleries.addGalleryName);
