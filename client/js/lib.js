// cache jquery elements
var $cursor,
    $progress,
    $carousels,
    $previous,
    $next,
    $screen,
    $buttons,
    $timer;

// global vars
var carousels = [],                                         // carousel object
    window_width, window_height,                            // clients resolution
    kinect_cursor_x, kinect_cursor_y, kinect_cursor_z,      // original position data from kinect (res: 640x480)
    cursor_x, cursor_y,                                     // converted position data from kinect res to client res
    _translateZ, translateZ, translateY = 0, rotation,      // carousel perspective
    progress_in_action = false,                             // check if progress-pie of cursor el is in action
    timer,                                                  // timer for progress-pie
    timerSeconds = 2,                                       // progress-pie countdown time
    timerFinish,                                            // time for progress-pie countdown
    progress_hover_element,                                 // element that's hovered by virtual cursor
    transformProp = Modernizr.prefixed('transform'),        // check CSS3 transforms
    navigation_left_width, navigation_right_width,          // width of navigation areas
    max_figure_height = 0,                                  // store the max figure height to calc the max Y translation 
    active_carousel = 0,                                    // store the number of the active carousel
    spacing = 500;                                          // spacing between screens

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

    // do some trig to figure out how big the carousel is in 3D space
    this.radius = Math.round( ( this.panelSize / 2) / Math.tan( Math.PI / this.panelCount ) );
    _translateZ = this.radius * -1;
    translateZ = _translateZ;
    
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
    rotation = this.rotation;

    this.transform();

};

Carousel3D.prototype.transform = function() {
    this.element.style[ transformProp ] = 'translateZ(' + translateZ + 'px) translateY(' + translateY + 'px) ' + this.rotateFn + '(' + rotation + 'deg)';    
};

// TODO: clean up
function drawTimer(percent){
    $('div.timer').html('<div class="percent"></div><div id="slice"'+(percent > 50?' class="gt50"':'')+'><div class="pie"></div>'+(percent > 50?'<div class="pie fill"></div>':'')+'</div>');
    var deg = 360/100*percent;
    $('#slice').find('.pie').css({'-webkit-transform':'rotate('+deg+'deg)'});
}

function stopWatch(){
    var seconds = (timerFinish-(new Date().getTime()))/1000;
    if(seconds <= 0){
        drawTimer(100);
        clearInterval(timer);
        
        // trigger click if progress timer is done
        handleButtonClick($(progress_hover_element));
        
    }else{
        var percent = 100-((seconds/timerSeconds)*100);
        drawTimer(percent);
    }
}

function checkCursorPosition() {

    /********************/
    /* BUTTON FUNCTIONS */
    /********************/
    
    var hover = false;
    $buttons.each(function() {
        
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
            progress_hover_element = document.elementFromPoint(button_x,button_y);
        }
        
    });
      
    // start progress animation if at least one button is covered by the cursor
    if (hover) {
        if (!progress_in_action) {
            $timer.show();
            timerFinish = new Date().getTime()+(timerSeconds*1000);
            timer = setInterval('stopWatch()',50);
            progress_in_action = true;
        }
    } else {
        $timer.hide();        
        clearInterval(timer);
        drawTimer(0);
        progress_in_action = false;        
    }

    /*******************/
    /* HOVER FUNCTIONS */
    /*******************/
        
    // check left/right hover area
    var el = document.elementFromPoint(cursor_x,cursor_y);
    
    console.log(el)
    
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
     */    
    
    if (direction == 'left') {
        cursor_position_in_percent = (1 - (cursor_x / navigation_left_width)) * 100;
        rotation = rotation + Math.pow((0.022 * cursor_position_in_percent), 3);
    } else if (direction == 'right') {
        cursor_position_in_percent = (1 - (((window_width - cursor_x) / (window_width - navigation_right_width)))) * 100;
        rotation = rotation - Math.pow((0.022 * cursor_position_in_percent), 3);
    }
    
    if (rotation < 0) {
        rotation = 360;
    } else if (rotation > 360) {
        rotation = 0;
    }

    carousels[active_carousel].transform();
    
}

function addCursor() {
    $cursor.css({'opacity':1});
}

function removeCursor() {
    $cursor.css({'opacity':0});
}

function moveCursor(data) {
    
    // get coordinates from node.js server
    // split string into single coordinate values
    var coordinates = data.split('/');
    kinect_cursor_x = parseFloat(coordinates[1].replace(/,/g,''));
    kinect_cursor_y = parseFloat(coordinates[2].replace(/,/g,''));
    kinect_cursor_z = parseFloat(coordinates[3].replace(/,/g,''));

    // extrapolate coordinates from kinect resolution to window resolution
    cursor_x = parseInt((kinect_cursor_x * window_width) / 640);
    cursor_y = parseInt((kinect_cursor_y * window_height) / 480);

    /*
     * calculate the depth
     *
     *   formula description:
     *   
     *   1. kinect z values have a range from 400mm to 3500mm (in effect, 4000mm, but we only track until 3500 because of 
	        limited space)
     *   2. our maximal range for zooming should be around 1000px (it felt good at testing), 
     *      but both increasing and decreasing, so: -300px - 300px
     *   3. so we need a factor to convert kinects range into our zooming range: kinect_range / zoom_range
     *   4. then we have to calculate the depth value with our range factor: (kinect_z - 399) / factor - 300;
     *      we substract 399 to prevent "division by zero" errors
     *   5. to speed up the zoom, we multiplacte the result with another factor (1.5 felt good at testing)
     * 
     */
    
    translateZ = _translateZ + (((kinect_cursor_z - 399) / 5.17) - 300) * 3.5;

    /*
     * calculate the Y translation
     *
     *   formula description:
     *   
     *   1. kinect returns Y data from 0 to 480 
     *   2. max translation belongs to max_figure_height (height of container whichs contains the most images)
	 *   3. add 1000 to max_figure_height, cause Y translation starts at -300 and we need 700px for spacing (looks better ;))
     *   4. convert both ranges and apply it to Y translation
     * 
     */

    translateY = ((kinect_cursor_y * ((max_figure_height + 1000) / 480)) * -1) + 300;
	
    $cursor.css({'left':cursor_x,'top':cursor_y});

    checkCursorPosition();
}

function handleKinectData(data) {
    
    // check the type of the server message
    if (data.indexOf('handposition') != -1) {
        moveCursor(data);
    } else if (data.indexOf('found') != -1) {
        addCursor();
    } else if (data.indexOf('lost') != -1) {
        removeCursor();
    }
}

function handleButtonClick($obj) {
    
    var type = $obj.data('type');

    if (type == 'navigation') {
        var increment = parseInt( $obj.data('increment') );
        carousels[active_carousel].rotation += carousels[active_carousel].theta * increment * -1;
        carousels[active_carousel].transform();
    } else if (type == 'switch') {
        var target = $obj.data('target');
        active_carousel = target;
        
        // calculate translation to move to next carousel
        var left = target * window_width;
        
        if (target > 0) {
            left += spacing * target;
        }
        
        $('.wrapper-inner').css({'-webkit-transform':'translate3D(-'+left+'px,0,0)'});
    }
}

$(function() {

    window_width = $(window).width();
    window_height = $(window).height();
    $cursor = $('#cursor');
    $progress = $('#progress');
    $carousels = $('.carousel');
    $previous = $('#previous');
    $next = $('#next');    
    $screen = $('.screen');
    $buttons = $('#navigation').find('button');
    $timer = $('.timer');
    
    navigation_left_width = $('#left').width();
    navigation_right_width = $('#right').width();    

    // websocket gedöns
    if(!('WebSocket' in window)) {
        alert('Sorry your browser does not support web sockets');
    } else {

        var connection = new WebSocket('ws://127.0.0.1:4344');

        connection.onerror = function (error) {
            console.log('WebSocket Error ' + error);
        };

        connection.onmessage = function (e) {
            handleKinectData(e.data);
        };
    }
    
    // init carousels
    $carousels.each(function(i) {
        carousels[i] = new Carousel3D($(this).get(0)); // get raw dom element

        // populate on startup
        carousels[i].panelCount = $(this).find('figure').length;
        carousels[i].modify();        
        
    });

    // set carousel to middle of screen
    //var t = (window_height - $carousel.height()) / 2;
    //$carousel.css({'top':t});    
    
    $(document).on('click','button',function(){
        handleButtonClick($(this));
        return false;
    });
    
    // set some initial widths for multiple carousels
    $('.wrapper-outer').width(window_width);
    $('.wrapper-inner').width($carousels.length * window_width);

    $screen.width(window_width);
    $screen.each(function(i) {
        var l = i * window_width;
        
        // all screens, except the first, get a spacing to the left screen
        if (i > 0) {
            l += spacing * i;
        }
        
        $(this).css({'left':l});
    });

    $buttons.each(function(i) {
        var l = i * $(this).width();
        $(this).css({'left':l});
    });    

    /*
    $carousels.each(function(){
        $(this).find('figure').each(function(){
            var $obj = $(this);
            if (max_figure_height < $obj.height()) {
                max_figure_height = $obj.height();
            }    
        });
    });
    */

});
