var pfx = (function () {
    var style = document.createElement('dummy').style,
        prefixes = 'Webkit Moz O ms Khtml'.split(' '),
        memory = {};
        
    return function ( prop ) {
        if ( typeof memory[ prop ] === "undefined" ) {
            var ucProp  = prop.charAt(0).toUpperCase() + prop.substr(1),
                props   = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
            memory[ prop ] = null;
            for ( var i in props ) {
                if ( style[ props[i] ] !== undefined ) {
                    memory[ prop ] = props[i];
                    break;
                }
            }
        }
        return memory[ prop ];
    }
})();

var translate = function ( t ) {
    return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
};
var
 byId = function ( id ) {
    return document.getElementById(id);
};

var arrayify = function ( a ) {
    return [].slice.call( a );
};

var $$ = function ( selector, context ) {
    context = context || document;
    return arrayify( context.querySelectorAll(selector) );
};

var css = function ( el, props ) {
    var key, pkey;
    for ( key in props ) {
        if ( props.hasOwnProperty(key) ) {
            pkey = pfx(key);
            if ( pkey != null ) {
                el.style[pkey] = props[key];
            }
        }
    }
    return el;
};

var initMenu = function() {
	var menu = byId('etudes_menu');

    drawMenuBackground(menu.offsetWidth, menu.offsetHeight);

    menu.addEventListener('webkitTransitionEnd', function(e){
        if(menu.getAttribute('class') == 'hide'){
            menu.style.setProperty('display','none');
        }
    });

    menu.setAttribute('class', 'hide');
};

var drawMenuBackground = function (rectWidth, rectHeight){

    var context = document.getCSSCanvasContext('2d', 'menu_background', rectWidth, rectHeight);    

    var arrowHeight = 20;
    var radius = 6;
    var lineWidth = 1;
    var pad = lineWidth/2;
    var xs = pad;
    var ys = pad + arrowHeight;
    var xe = rectWidth - pad;
    var ye = rectHeight - pad;

    var gradient = context.createLinearGradient(rectWidth/2, 0, rectWidth/2, arrowHeight * 2);
    gradient.addColorStop(0, '#eee'); 
    gradient.addColorStop(1, '#151d31'); 

    context.beginPath();

    context.lineJoin = 'miter';

    context.moveTo(xs + radius, ys);

    //console.log(rectWidth);

    // context.lineTo(rectWidth/2 - (arrowHeight + pad), ys);
    // context.lineTo(rectWidth/2, pad);
    // context.lineTo(rectWidth/2 + (arrowHeight + pad), ys);

    context.lineTo(xe - radius, ys);

    context.arcTo(xe, ys, xe, ys + radius, radius);

    context.lineTo(xe, ye - radius);
    context.arcTo(xe, ye, xe - radius, ye, radius);

    context.lineTo(xs + radius, ye);
    context.arcTo(xs, ye, xs, ye - radius, radius);

    context.lineTo(xs, ys + radius);
    context.arcTo(xs, ys, xs + radius, ys, radius);

    context.fillStyle = gradient;

    //context.fillStyle = '#000';
    context.globalAlpha = .95;
    context.fill();

    context.globalAlpha=1;

    context.strokeStyle = '#48484a';
    context.lineWidth = lineWidth;
    context.stroke();
};


var showMenu = function (el){

    var menu = byId('etudes_menu');

    menu.style.setProperty('display','block');    

    var targetLeft = el.offsetLeft;
    var targetBottom = el.offsetHeight;
    var targetWidth = el.offsetWidth;    
    var menuWidth = menu.offsetWidth;

    var menuLeft = targetLeft + (targetWidth/2) - (menuWidth/2);

    menu.style.setProperty('top', (768 - (menu.offsetHeight + 40)) + 'px');
    menu.style.setProperty('left', menuLeft + 'px');

    menu.setAttribute('class', 'show');

    // menu.onclick = function(e){
    //     if(e.target.tagName.toLowerCase() == 'a'){
    //         var type = e.target.innerHTML;
    //         var link = el.getAttribute('href');
    //         alert(type + 'ing ' + link);
    //         menu.setAttribute('class','hide');
    //     }
    // }
};


(function (document,window) {
    'use strict';

    var viewport = byId("viewport");

    var steps = $$(".step", viewport);

    steps.forEach(function (el){
        var data = el.dataset,
            step = {                
                next: data.next,            
                prev: data.prev,
                up: data.up,
                down: data.down,
                translate:{
                    x: data.x || 0,
                    y: data.y || 0,
                    z: data.z || 0
                   }
        };

        el.stepData = step;

        css(el, {           
            transform: translate(step.translate),
        });
    });


    // Navigation Methods
    var active = null;
    var current = {
        translate: { x: 0, y: 0, z: 0 }
    };

    var select = function (el){
        if (!el || !el.stepData || el == active){
            // selected element is not defined as step or is already active
            return false;
        }

        var step = el.stepData;

        if (active) {
            active.classList.remove("active");
        }

        el.classList.add("active");

        eADV.className = "step-" + el.id;

        var target = {
            translate :{
                x: -step.translate.x,
                y: -step.translate.y,
                z: -step.translate.z
            }
        };

        // if presentation starts (nothing is active yet)
        // don't animate (set duration to 0)
        var duration = (active) ? "200ms" : "0";

        css(viewport, {
            transform: translate(target.translate),
            transitionDuration: duration,
            transitionDelay: "0ms"
        });

        current = target;
        active = el;
        
        return el;
    };

    var navigate = function(destination){
        if(destination) {
            select(byId(destination));
        }
    };

    var selectPrev = function () {
        navigate(active.stepData.prev);
    };
     
    var selectNext = function () {
        navigate(active.stepData.next);
    };

    var selectUp = function(){
       navigate(active.stepData.up);
    };

    var selectDown = function(){
        navigate(active.stepData.down);
    };

    // Swipe management
    var fingerCount = 0;
    var startX = 0;
    var startY = 0;
    var curX = 0;
    var curY = 0;
    var deltaX = 0;
    var deltaY = 0;
    var horzDiff = 0;
    var vertDiff = 0;
    var minLength = 72; // the shortest distance the user may swipe
    var swipeLength = 0;
    var swipeAngle = null;
    var swipeDirection = null;
    var triggerElementID = null; // this variable is used throughout the script

    var touchStart = function (event,passedID) {
        // event delegation with "bubbling"
        // check if event target (or any of its parents is a link or a step)
        var target = event.target;
        while ( (target.tagName != "A") && (target != document.body) ) {
            target = target.parentNode;
        }
        
        if ( target.tagName == "A" ) {
            var href = target.getAttribute("href");
            
            // if it's a link to presentation step, target this step
            if ( href && href[0] == '#' ) {
                target = byId( href.slice(1) );
            }
        }
        
        if ( select(target) ) {
            event.preventDefault();
        }
                
        // disable the standard ability to select the touched object
        event.preventDefault();
        // get the total number of fingers touching the screen
        fingerCount = event.touches.length;
        // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
        // check that only one finger was used
        if ( fingerCount == 1 ) {
            // get the coordinates of the touch
            startX = event.touches[0].pageX;
            startY = event.touches[0].pageY;
            // store the triggering element ID
            triggerElementID = passedID;
        } else {
            // more than one finger touched so cancel
            touchCancel(event);
        }
    };

    var touchMove = function(event) {        
        event.preventDefault();
        if ( event.touches.length == 1 ) {
            curX = event.touches[0].pageX;
            curY = event.touches[0].pageY;
        } else {
            touchCancel(event);
        }


        // translate immediately 1-to-1
      	//css() = 'translate3d(' + (this.deltaX - this.index * this.width) + 'px,0,0)';

      	// css(viewport, {
       //      transform: translate(target.translate)
       //  });
    };
    
    var touchEnd = function (event) {
        
        event.preventDefault();
        // check to see if more than one finger was used and that there is a and ending coordinate
        if ( fingerCount == 1 && curX != 0 ) {
            // use the Distance Formula to determine the length of the swipe
            swipeLength = Math.round(Math.sqrt(Math.pow(curX - startX,2) + Math.pow(curY - startY,2)));
            // if the user swiped more than the minimum length, perform the appropriate action
            if ( swipeLength >= minLength ) {
                caluculateAngle();
                determineSwipeDirection();
                processingRoutine();
                touchCancel(event);
            } else {
                touchCancel(event);
            }   
        } else {
            touchCancel(event);
        }
    };

    var touchCancel = function (event) {
        // reset the variables back to default values
        fingerCount = 0;
        startX = 0;
        startY = 0;
        curX = 0;
        curY = 0;
        deltaX = 0;
        deltaY = 0;
        horzDiff = 0;
        vertDiff = 0;
        swipeLength = 0;
        swipeAngle = null;
        swipeDirection = null;
        triggerElementID = null;
    };
    
    var caluculateAngle = function () {
        var X = startX-curX;
        var Y = curY-startY;
        var Z = Math.round(Math.sqrt(Math.pow(X,2)+Math.pow(Y,2))); //the distance - rounded - in pixels
        var r = Math.atan2(Y,X); //angle in radians (Cartesian system)
        swipeAngle = Math.round(r*180/Math.PI); //angle in degrees
        if ( swipeAngle < 0 ) { swipeAngle =  360 - Math.abs(swipeAngle); }
    };
    
    var determineSwipeDirection = function() {
        if ( (swipeAngle <= 45) && (swipeAngle >= 0) ) {
            swipeDirection = 'left';
        } else if ( (swipeAngle <= 360) && (swipeAngle >= 315) ) {
            swipeDirection = 'left';
        } else if ( (swipeAngle >= 135) && (swipeAngle <= 225) ) {
            swipeDirection = 'right';
        } else if ( (swipeAngle > 45) && (swipeAngle < 135) ) {
            swipeDirection = 'down';
        } else {
            swipeDirection = 'up';
        }
    };

    // Events    
    document.addEventListener("keydown", function ( event ) {
        if ( event.keyCode == 9 || ( event.keyCode >= 32 && event.keyCode <= 34 ) || (event.keyCode >= 37 && event.keyCode <= 40) ) {
            switch( event.keyCode ) {                
                case 37: // left
                         selectPrev();
                         break;
                case 38:   // up
                         selectUp();
                         break;
                case 9:  ; // tab
                case 32: ; // space
                case 34: ; // pg down
                case 39:  // right
                        selectNext();
                        break;
                case 40:   // down
                        selectDown();
                        break;
            }
            
            event.preventDefault();
        }
    }, false);

    document.addEventListener("click", function ( event ) {
        // event delegation with "bubbling"
        // check if event target (or any of its parents is a link or a step)
        var target = event.target;
        while ( (target.tagName != "A") &&
                (!target.stepData) &&
                (target != document.body) ) {
            target = target.parentNode;
        }
        
        if ( target.tagName == "A" ) {
            var href = target.getAttribute("href");
            
            // if it's a link to presentation step, target this step
            if ( href && href[0] == '#' ) {
                target = byId( href.slice(1) );
            }
        }
        else
        {
        	var menu = byId('etudes_menu');
	        if (menu.classList.contains('show'))
	        {
	        	menu.setAttribute('class','hide');
	        }
        }
        
        if ( select(target) ) {
            event.preventDefault();
        }        
    }, false);

     var processingRoutine = function () {
        if ( swipeDirection == 'left' ) {               
            selectPrev();
        } else if ( swipeDirection == 'right' ) {
            selectNext();
        } else if ( swipeDirection == 'up' ) {
            selectUp();
        } else if ( swipeDirection == 'down' ) {
           selectDown();        
        }
    };

	initMenu();
    // Start with first step
    select(steps[0]);

})(document, window);
