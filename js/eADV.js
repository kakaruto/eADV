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

var byId = function ( id ) {
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

    // Start with first step
    select(steps[0]);

})(document, window);
