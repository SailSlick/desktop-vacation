// All includes from src should be done here
import Images from './javascript/images';

// Link DOM events to functions
$('#btn-view-images').click(Images.view);
$('#btn-add-images').click(Images.getNew);
