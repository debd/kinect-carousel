// cache jquery elements
var $cursor,
  $progress,
  $carousels,
  $previous,
  $next,
  $screen,
  $buttons,
  $timer,
  $wrapper,
  $navigation;

// global vars
var carousels = [],                                       // carousel object
  window_width, window_height,                            // clients resolution
  kinect_cursor_x, kinect_cursor_y, kinect_cursor_z,      // original position data from kinect (res: 640x480)
  cursor_x, cursor_y,                                     // converted position data from kinect res to client res
  progress_in_action = false,                             // check if progress-pie of cursor el is in action
  timer,                                                  // timer for progress-pie
  timerSeconds = 1,                                       // progress-pie countdown time
  timerFinish,                                            // time for progress-pie countdown
  progress_hover_element,                                 // element that's hovered by virtual cursor
  transformProp = Modernizr.prefixed('transform'),        // get correct vendor prefix
  navigation_left_width, navigation_right_width,          // width of navigation areas
  c = 0,                                                  // store the number of the active carousel
  random,                                                 // store current amount of random images temporary
  image_set_min = 2,                                      // minimum images per image set
  image_set_max = 5,                                      // maximum images per image set
  kinect_attached = false,                                  // check websocket connection
  rotate_interval = null,                                 // store interval for continous rotation on mousemove
  mouse_data = {                                          // store mouse directions (x, y, z)
    pageX: 0,
    pageY: 0,
    pageZ: 0
  };

/*******************
 * KAROUSEL
 *******************/

function Karousel(el) {
  this.element = el;
  this.rotation = 0;
  this.panelCount = 0;
  this.totalPanelCount = this.element.children.length;
  this.theta = 0;
  this.isHorizontal = true;
  this._translateZ = 0;
  this.translateZ = 0;
  this.translateY = 0;
  this.max_height = 0;
}

Karousel.prototype.modify = function () {

  var panel, angle, i;

  this.panelSize = this.element[ this.isHorizontal ? 'offsetWidth' : 'offsetHeight' ];
  this.rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
  this.theta = 360 / this.panelCount;

  // do some trig to figure out how big the carousel is in 3D space
  this.radius = Math.round(( this.panelSize / 2) / Math.tan(Math.PI / this.panelCount));
  this._translateZ = this.radius * -1;
  this.translateZ = this._translateZ;

  for (i = 0; i < this.panelCount; i++) {

    panel = this.element.children[i];
    angle = this.theta * i;
    panel.style.opacity = 1;

    // rotate panel, then push it out in 3D space
    panel.style[ transformProp ] = this.rotateFn + '(' + angle + 'deg) translateZ(' + this.radius + 'px)';
  }

  // hide other panels
  for (; i < this.totalPanelCount; i++) {
    panel = this.element.children[i];
    panel.style.opacity = 0;
    panel.style[ transformProp ] = 'none';
  }

  // adjust rotation so panels are always flat
  this.rotation = Math.round(this.rotation / this.theta) * this.theta;
  this.transform();

};

Karousel.prototype.transform = function () {
  this.element.style[ transformProp ] = 'translateZ(' + this.translateZ + 'px) translateY(' + this.translateY + 'px) ' + this.rotateFn + '(' + this.rotation + 'deg)';
};

/*******************
 * INTERACTIONS
 *******************/

function drawTimer(percent) {
  $('div#timer').html('<div class="percent"></div><div id="slice"' + (percent > 50 ? ' class="gt50"' : '') + '><div class="pie"></div>' + (percent > 50 ? '<div class="pie fill"></div>' : '') + '</div>');
  var deg = 360 / 100 * percent;
  $('#slice').find('.pie').css({'-webkit-transform': 'rotate(' + deg + 'deg)'});
}

function stopWatch() {
  var seconds = (timerFinish - (new Date().getTime())) / 1000;
  if (seconds <= 0) {
    drawTimer(100);
    clearInterval(timer);

    // trigger click if progress timer is done
    handleButtonClick($(progress_hover_element));

  } else {
    var percent = 100 - ((seconds / timerSeconds) * 100);
    drawTimer(percent);
  }
}

function checkCursorPosition() {

  /********************
   * BUTTON FUNCTIONS
   ********************/

  if (kinect_attached) {

    var hover = false;
    $buttons.each(function () {

      // get button coordinates
      var button_x = $(this).offset().left;
      var button_y = $(this).offset().top;

      // get button dimensions
      var button_width = $(this).width();
      var button_height = $(this).height();

      // check if cursor is inside button
      if (
        ( cursor_x >= button_x )
          && ( (cursor_x + 50) <= ( button_x + button_width ) )
          && ( cursor_y >= button_y )
          && ( (cursor_y + 50) <= ( button_y + button_height ) )
        ) {

        hover = true;

        // find element at cursor position
        progress_hover_element = document.elementFromPoint(button_x, button_y);
      }

    });

    // start progress animation if at least one button is covered by the cursor
    if (hover) {
      if (!progress_in_action) {
        $timer.show();
        timerFinish = new Date().getTime() + (timerSeconds * 1000);
        timer = setInterval('stopWatch()', 50);
        progress_in_action = true;
      }
    } else {
      $timer.hide();
      clearInterval(timer);
      drawTimer(0);
      progress_in_action = false;
    }

  }

  /*******************
   * HOVER FUNCTIONS
   *******************/

  // check left/right hover area
  var el = document.elementFromPoint(cursor_x, cursor_y);

  var direction = $(el).attr('id');
  var cursor_position_in_percent;

  /*
   * calculate the rotation
   *
   *   formula description:
   *
   *   1. to get a smooth rotation, use a power function
   *   2. to convert our values (0 - 100; position in percent, relative to hover area) to a rotation value from
   *       0 to 10 (degree), the following factors are needed:
   *
   *       a = 0,022
   *       x = cursor_position_in_percent
   *       n = 3
   *
   *       y = f(x) = ax^n
   *       y = f(x) =  0,022 * x ^ 3
   *
   *   ! Set another speed level if user interacts with a mouse
    *
   */

  var a, n;
  if (kinect_attached) {
    a = 0.022;
    n = 3;
  } else {
    a = 0.005;
    n = 3;
  }

  function rotate() {
    if (direction == 'left') {
      cursor_position_in_percent = (1 - (cursor_x / navigation_left_width)) * 100;
      carousels[c].rotation = carousels[c].rotation + Math.pow((a * cursor_position_in_percent), n);
    } else if (direction == 'right') {
      cursor_position_in_percent = (1 - (((window_width - cursor_x) / (window_width - navigation_right_width)))) * 100;
      carousels[c].rotation = carousels[c].rotation - Math.pow((a * cursor_position_in_percent), n);
    }

    if (carousels[c].rotation < 0) {
      carousels[c].rotation = 360;
    } else if (carousels[c].rotation > 360) {
      carousels[c].rotation = 0;
    }

    carousels[c].transform();
  }

  if (kinect_attached) {
    rotate();
  } else {
    rotate_interval = setInterval(rotate,16);   // 60 frames per seconds
  }

}

function addCursor() {
  $cursor.css({'opacity': 1});
}

function removeCursor() {
  $cursor.css({'opacity': 0});
}

function moveCarousel(data,type) {

  if (type == 'kinect') {
    // get coordinates from node.js server
    // split string into single coordinate values
    var coordinates = data.split('/');
    kinect_cursor_x = parseFloat(coordinates[1].replace(/,/g, ''));
    kinect_cursor_y = parseFloat(coordinates[2].replace(/,/g, ''));
    kinect_cursor_z = parseFloat(coordinates[3].replace(/,/g, ''));

    // extrapolate coordinates from kinect resolution to window resolution
    cursor_x = parseInt((kinect_cursor_x * window_width) / 640);
    cursor_y = parseInt((kinect_cursor_y * window_height) / 480);
  } else if (type == 'mouse') {
    cursor_x = data.pageX;
    cursor_y = data.pageY;
    kinect_cursor_x = data.pageX;
    kinect_cursor_y = data.pageY;
    kinect_cursor_z = data.pageZ;
  }

  /*
   * calculate the depth
   *
   *   formula description:
   *
   *   1. kinect z values have a range from 400mm to 3500mm (in effect, 4000mm, but we only track until 3500 because of
   *      limited space)
   *   2. our maximal range for zooming should be around 1000px (it felt good at testing),
   *      but both increasing and decreasing, so: -300px - 300px
   *   3. so we need a factor to convert kinects range into our zooming range: kinect_range / zoom_range
   *   4. then we have to calculate the depth value with our range factor: (kinect_z - 399) / factor - 300;
   *      we substract 399 to prevent "division by zero" errors
   *   5. to speed up the zoom, we multiplacte the result with another factor (3.5 felt good at testing)
   *
   *   ! Remove interpolation if user interacts with a mouse and substract 500 from cursor to get a higher zoom out
   *     level and add 2000 to get a higher zoom in level
   *
   */

  if (kinect_attached) {
    carousels[c].translateZ = carousels[c]._translateZ + (((kinect_cursor_z - 399) / 5.17) - 300) * 3.5;
  } else {
    carousels[c].translateZ = carousels[c]._translateZ + (((kinect_cursor_z - 500) * 2000) / window_height);
  }

  /*
   * calculate the Y translation
   *
   *   formula description:
   *
   *   1. kinect returns Y data from 0 to 480
   *   2. max translation belongs to max_figure_height (height of container whichs contains the most images)
   *   3. add 1700 to max_figure_height, cause Y translation starts at -700 and we need 1000px for spacing (looks better ;))
   *   4. convert both ranges and apply it to Y translation
   *
   *   ! Remove interpolation if user interacts with a mouse and add spacing of 300px on top/bottom
   *
   */

  if (kinect_attached) {
    carousels[c].translateY = 700 + (kinect_cursor_y * ((carousels[c].max_height + 1700) / 480)) * -1;
  } else {
    carousels[c].translateY = 300 + ((kinect_cursor_y * (carousels[c].max_height + 600)) / window_height) * -1;
  }

  // move virtual cursor
  $cursor.css({'left': cursor_x, 'top': cursor_y});

  // check cursor positionf or translateX actions and button clicks
  checkCursorPosition();
}

function handleKinectData(data) {

  // check the type of the server message
  if (data.indexOf('handposition') != -1) {
    moveCarousel(data,'kinect');
  } else if (data.indexOf('found') != -1) {
    addCursor();
  } else if (data.indexOf('lost') != -1) {
    removeCursor();
  }
}

function handleButtonClick($obj) {

  var type = $obj.data('type');

  if (type == 'switch') {
    c = $obj.data('target');

    // set active button
    $buttons.removeClass('active');
    $buttons.eq(c).addClass('active');

    // calculate translation to move to next carousel
    var top = $screen.eq(c).css('top');

    $wrapper.css({'-webkit-transform': 'translate3D(0,-' + top + ',0)'});
  }
}

function insertRandomImages(images) {

  // get the last insertert element
  var $l = $('.carousel').last();

  // get random number for the count of images in a column
  var r = Math.floor(Math.random() * image_set_max) + image_set_min;

  $l.append('<figure></figure>');

  for (var i = 1; i <= r; i++) {

    // don't add more tags as images
    if (random < images.length) {
      var img = images[random].substring(3); // remove the "../" at the beginning of the filename
      $l.find('figure').last().append('<img src="' + img + '">');
      random++;
    }
  }

  // start recursive loop for the rest of the images
  if (random < images.length) {
    insertRandomImages(images);
  }

}

$(function () {

  $wrapper = $('#wrapper');
  $navigation = $('#navigation');

  // build image carousel html
  $.ajax({
    type: 'GET',
    url: 'php/dir.php',
    dataType: 'json',
    async: false,
    success: function (res) {
      var i = 0;
      $.each(res, function (key, images) {

        // reset random var for each carousel (folder = carousel)
        random = 0;

        // insert carousel container
        $wrapper.append('<div class="screen"><div class="container"><div class="carousel"></div></div></div>');

        // insert images
        insertRandomImages(images);

        // insert button
        $navigation.append('<button data-type="switch" data-target="' + i + '">' + key + '</button>');

        i++;

      });
    }
  });

  window_width = $(window).width();
  window_height = $(window).height();
  $cursor = $('#cursor');
  $progress = $('#progress');
  $carousels = $('.carousel');
  $previous = $('#previous');
  $next = $('#next');
  $screen = $('.screen');
  $buttons = $navigation.find('button');
  $buttons.first().addClass('active');

  $timer = $('#timer');
  navigation_left_width = $('#left').width();
  navigation_right_width = $('#right').width();

  // websocket gedöns
  if (!('WebSocket' in window)) {
    alert('Sorry your browser does not support web sockets');
  } else {

    var connection = new WebSocket('ws://127.0.0.1:4344');

    connection.onerror = function() {
      console.log('WebSocket Error: ' + connection.readyState);
    };

    connection.onopen = function () {
      kinect_attached = true;
    };

    connection.onmessage = function(e) {
      handleKinectData(e.data);
    };

  }

  // mouse-click event for buttons
  $(document).on('click', 'button', function(){
    handleButtonClick($(this));
    return false;
  });

  // set width and margin of each button
  var b = window_width / $buttons.length;
  $buttons.each(function (i) {
    var l = i * b;
    $(this).css({'width': b, 'left': l});
  });

});

$(window).load(function () {

  // top margin
  var top = 0;

  // use mouse cursor if no kinect is attached
  if (!kinect_attached) {

    // get mouse move and scroll events to control x, y and z axis
    $(document).mousemove(function(e) {

      mouse_data.pageX = e.pageX;
      mouse_data.pageY = e.pageY;

      moveCarousel(mouse_data, 'mouse');
    });

    window.addEventListener('mousewheel', function(e) {

      var r;

      // use mousewheel for depth-scrolling only in a range from 10% to 90% of the browser width
      if (
        mouse_data.pageX > window_width * 0.1 &&
        mouse_data.pageX < window_width * 0.9 &&
        mouse_data.pageY > window_height * 0.1 &&
        mouse_data.pageY < window_height * 0.9
      ) {
        if (e.wheelDelta < 0) {
          mouse_data.pageZ = mouse_data.pageZ - 50;
        } else {
          mouse_data.pageZ = mouse_data.pageZ + 50
        }

        // limit depth to a range of -2000px till 2000px
        if (mouse_data.pageZ < -2000) {
          mouse_data.pageZ = -2000;
        } else if (mouse_data.pageZ > 2000) {
          mouse_data.pageZ = 2000;
        }

        moveCarousel(mouse_data, 'mouse');

        // prevent normal scrolling
        r = false;
      }

      return r;

    });

  }

  // init carousels when all images are loaded
  $carousels.each(function (i) {

    // init carousel
    carousels[i] = new Karousel($(this).get(0)); // get raw dom element

    // populate on startup
    carousels[i].panelCount = $(this).find('figure').length;
    carousels[i].modify();

    // figure height
    $(this).find('figure').each(function () {
      var $obj = $(this);
      if (carousels[i].max_height < $obj.height()) {
        carousels[i].max_height = $obj.height();
      }
    });

    top += carousels[i].max_height;

    // set width and margin
    // first carousel doesn't get top margin
    var m = (i == 0) ? 0 : top;
    $screen.eq(i).css({'width': window_width, 'top': m});

    // set carousel to middle of screen
    var t = (window_height - $(this).height()) / 2;
    $(this).css({'top': t});

  });
});