// cache jquery elements
var $cursor,
    $progress,
    $cj_carousel;

// global vars
var window_width,
    window_height,
    kinect_cursor_x, kinect_cursor_y, kinect_cursor_z,  // original position data from kinect (res: 640x480)
    cursor_x, cursor_y,                                 // converted position data from kinect res to client res
    translateZ, translateX,                             // carousel 3D-data
    progress_in_action = false,                         // check if progress-pie of cursor el is in action
    timer,                                              // timer for progress-pie
    timerSeconds = 2,                                   // progress-pie countdown time
    timerFinish,                                        // time for progress-pie countdown
    transformProp = Modernizr.prefixed('transform');    // check CSS3 transforms

/*
 * By David DeSandro
 * http://desandro.github.io/3dtransforms/
 * http://desandro.com/
 *
 * START CODE SNIPPET
 *
 */

function Carousel3D ( el ) {
    this.element = el;
    this.rotation = 0;
    this.panelCount = 0;
    this.totalPanelCount = this.element.children.length;
    this.theta = 0;
    this.isHorizontal = true;
}

Carousel3D.prototype.modify = function() {

    var panel, angle, i;

    this.panelSize = this.element[ this.isHorizontal ? 'offsetWidth' : 'offsetHeight' ];
    this.rotateFn = this.isHorizontal ? 'rotateY' : 'rotateX';
    this.theta = 360 / this.panelCount;

    // do some trig to figure out how big the carousel
    // is in 3D space
    this.radius = Math.round( ( this.panelSize / 2) / Math.tan( Math.PI / this.panelCount ) );

    for ( i = 0; i < this.panelCount; i++ ) {
        panel = this.element.children[i];
        angle = this.theta * i;
        panel.style.opacity = 1;
        // rotate panel, then push it out in 3D space
        panel.style[ transformProp ] = this.rotateFn + '(' + angle + 'deg) translateZ(' + this.radius + 'px)';
    }

    // hide other panels
    for (  ; i < this.totalPanelCount; i++ ) {
        panel = this.element.children[i];
        panel.style.opacity = 0;
        panel.style[ transformProp ] = 'none';
    }

    // adjust rotation so panels are always flat
    this.rotation = Math.round( this.rotation / this.theta ) * this.theta;

    this.transform();

};

Carousel3D.prototype.transform = function() {
    // push the carousel back in 3D space,
    // and rotate it
    this.element.style[ transformProp ] = 'translateZ(-' + this.radius + 'px) ' + this.rotateFn + '(' + this.rotation + 'deg)';
};

/*
 * By David DeSandro
 * http://desandro.github.io/3dtransforms/
 * http://desandro.com/
 *
 * END CODE SNIPPET
 *
 */

function drawTimer(percent){
    $('div.timer').html('<div class="percent"></div><div id="slice"'+(percent > 50?' class="gt50"':'')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');
    var deg = 360/100*percent;
    $('#slice .pie').css({
        '-moz-transform':'rotate('+deg+'deg)',
        '-webkit-transform':'rotate('+deg+'deg)',
        '-o-transform':'rotate('+deg+'deg)',
        'transform':'rotate('+deg+'deg)'
    });
}

function stopWatch(){
    var seconds = (timerFinish-(new Date().getTime()))/1000;
    if(seconds <= 0){
        drawTimer(100);
        clearInterval(timer);
    }else{
        var percent = 100-((seconds/timerSeconds)*100);
        drawTimer(percent);
    }
}

function checkMenu() {
    var $button = $('#button1');
    var button_x = $button.offset().left;
    var button_y = $button.offset().top;

    if (cursor_y > button_y) {
        if (!progress_in_action) {
            timerFinish = new Date().getTime()+(timerSeconds*1000);
            timer = setInterval('stopWatch()',50);
            progress_in_action = true;
        }
    } else {
        clearInterval(timer);
        drawTimer(0);
        progress_in_action = false;
    }
}

function addCursor() {
    $cursor.css({'opacity':1});
}

function removeCursor() {
    $cursor.css({'opacity':0});
}

function moveCursor(data) {
    var coordinates = data.split('/');
    kinect_cursor_x = parseFloat(coordinates[1].replace(/,/g,''));
    kinect_cursor_y = parseFloat(coordinates[2].replace(/,/g,''));
    kinect_cursor_z = parseFloat(coordinates[3].replace(/,/g,''));

    cursor_x = parseInt((kinect_cursor_x * window_width) / 640);
    cursor_y = parseInt((kinect_cursor_y * window_height) / 480);

    translateZ = (((kinect_cursor_z - 399) / 5.17) - 300) * 1.3;
    translateX = ((kinect_cursor_y / 12) - 20) * 1.4;
    $cursor.css({'left':cursor_x,'top':cursor_y});

    checkMenu();
}

function handleKinectData(data) {
    if (data.indexOf('handposition') != -1) {
        moveCursor(data);
    } else if (data.indexOf('found') != -1) {
        addCursor();
    } else if (data.indexOf('lost') != -1) {
        removeCursor();
    }
}

$(function() {

    window_width = $(window).width();
    window_height = $(window).height();
    $cursor = $('#cursor');
    $progress = $('#progress');

    if(!("WebSocket" in window)) {
        alert('Sorry your browser does not support web sockets');
    } else {

        var connection = new WebSocket("ws://127.0.0.1:4343");

        connection.onerror = function (error) {
            console.log('WebSocket Error ' + error);
        };

        connection.onmessage = function (e) {
            handleKinectData(e.data);
        };
    }

    var carousel = new Carousel3D( document.getElementById('carousel') ),
        navButtons = document.querySelectorAll('#navigation button'),

        onNavButtonClick = function( event ){
            var increment = parseInt( event.target.getAttribute('data-increment') );
            carousel.rotation += carousel.theta * increment * -1;
            carousel.transform();
        };

    // populate on startup
    carousel.panelCount = 40;
    carousel.modify();

    /*
     panelCountInput.addEventListener( 'change', function( event ) {
     carousel.panelCount = event.target.value;
     carousel.modify();
     }, false);
     */

    for (var i=0; i < 2; i++) {
        navButtons[i].addEventListener( 'click', onNavButtonClick, false);
    }

    setTimeout( function(){
        document.body.addClassName('ready');
    }, 0);

});
