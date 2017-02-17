import $ from 'jquery';

const Notification = {
  show: (msg, colour_class) => {
    colour_class = colour_class || 'alert-success';
    $('#notification p')
      .html(msg)
      .parent().attr('class', colour_class);
    $('#notification').addClass('alert alert-dismissable fade show');
    setTimeout(Notification.hide, 3000);
  },

  hide: () =>
    $('#notification').attr('class', 'alert fade hide')
};

export default Notification;
