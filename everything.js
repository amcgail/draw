/*

note:
(
why does menu freeze everything up? 
probably the whole deleting from an array you're currently a part of when removing links.
could do hashed array too so we have unique keys and can still do "for( i in ... )"..
)(
a good next step would be to prioritize the following features in terms of interest / time to completion.
want to have the most satisfaction per time unit.
)

A list of todos that would make this project a lot better:

1. organize this damn code. it's a little crazy (could just do a little at a time)
2. finish text input. it already draws it (shift click for prompt), just need it to remember it
3. connect online with other computers' draws, and link stuff together

COOL FEATURES
4. the stuff you're looking at fades slowly while you look at it, and you have to "light it back up" to keep it around
5. blender-style splitting of windows, and some clarity on what should point to what... (when you press undo in one window, what happens?)
6. pictures??
7. resizing of canvases when browser window resizes
8. continuous zooming into deeper links (visually awesome)
9. ability to code the website from within the website (now that we can do text !!)
10. then search would be nice too


what about saving links on the side. like if you could keep them for later... then link to random things by clicking on them...?


*/

/*
function board( pref ) {
	this.pref = $.extend( {
		loc: null
	}, pref );

	this.strokes = [];
	this.links = [];
	this.text = [];

	this.loaded = 
	//Load from localStorage if exists.
	if( this.pref.loc != null )
		if( typeof localStorage[ this.pref.loc ] != 'undefined' )
			this.load( $.parseJSON( localStorage[ this.pref.loc ] ) );
}
*/

//**GOOD FOR DEBUGGING**
//localStorage.clear(  location.href.split( "#" )[1] );

function loadDrawing( name ) {
	//Initialize the drawing
	var result = {
		strokes: [],
		links: [],
		text: []
	};

	if( typeof localStorage[ name ] != 'undefined' )
		result = $.parseJSON( localStorage[ name ] );

	//Repair
	result = $.extend( {
		strokes: [],
		links: [],
		text: []
	}, result );

	return result;
}

var current_drawing = loadDrawing( location.href.split( "#" )[1] );

//Rescale canvas elements to window size
var desiredWidth = $( window ).width();
var desiredHeight = $( window ).height();
$("canvas#drawings, canvas#selection").attr( {
	"width": desiredWidth,
	"height": desiredHeight
} );

//************BEGIN FUDGE****************//

function wrapText(context, text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';

	for(var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = context.measureText(testLine);
		console.log( metrics );
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
			context.fillText(line, x, y);
			line = words[n] + ' ';
			y += lineHeight;
		}
		else {
			line = testLine;
		}
	}
	context.fillText(line, x, y);
}

function stop_selecting() {
	//Get rid of that pesky rectangle
	selection_ctx.clearRect( 0,0,desiredWidth,desiredHeight );
	state.mode = null;
}

$("canvas#menu").attr( {
	"width": desiredWidth,
	"height": 50
} );
var menu_ctx = $("#menu")[0].getContext("2d");

if( typeof localStorage["menu"] != 'undefined' ) {
	var loadmenu=$.parseJSON( localStorage[ "menu" ] );
	for( var kk in loadmenu.strokes ) {
		menu_ctx.beginPath();
		var str = loadmenu.strokes[kk];

		menu_ctx.moveTo( str.start[0], str.start[1] );

		if( str.points.length <= 2 ) {
			menu_ctx.arc( str.start[0], str.start[1], 5, 0, 2*Math.PI );
			menu_ctx.stroke();
			continue;
		}

		for (var i = 0, len = str.points.length; i < len-1; i++) {
			// we pick the point between pi+1 & pi+2 as the
			// end point and p1 as our control point
			var p1=str.points[i];
			var p2=str.points[i+1];

			menu_ctx.quadraticCurveTo(p1[0], p1[1], (p1[0]+p2[0])/2, (p1[1]+p2[1])/2);
		}
		var lastPt = str.points[ str.points.length-1 ];
		menu_ctx.lineTo( lastPt[0], lastPt[1] );
		menu_ctx.stroke();

	}
	$("#links").html("");

	for( var i in loadmenu.links ) {
		try {
			var l = loadmenu.links[i];
			var $caption = $("<div>").css( "top", l.c2[1] - l.c1[1] ).text( loadmenu.links[i].to );

			var $link = $("<div>").addClass( "link" ).css( {
				"left": l.c1[0],
				"top": l.c1[1],
				"width": l.c2[0] - l.c1[0],
				"height": l.c2[1] - l.c1[1]
			} ).appendTo( "#links_menu" );

			$link.append( $caption );

			$link.mousedown( ( function( to ) {
				return function( e ) {
					e.stopPropagation();
					e.preventDefault();
					if( to[0] == "." ) {
						if( typeof usrfns[ to.substring( 1 ) ] != 'undefined' )
							usrfns[ to.substring( 1 ) ]();
					} else
						location.href = location.href.split( "#" )[0] + "#" + to;
				};
			} )( loadmenu.links[i].to ) );
		} catch (e) {
			//#delete loadmenu.links[i];
		}
	}
}

//*************END FUDGE****************//

var $drawings = $("#drawings");
var drawings_ctx = $drawings[0].getContext("2d");

var $selection = $("#selection");
var selection_ctx = $selection[0].getContext("2d");
selection_ctx.strokeStyle = '#00fdcb';
selection_ctx.fillStyle = "rgba( 80, 80, 80, .20 )";

var state = {
	pos: null,
	btn: false,
	mode: "use",
	mousemoved: false
};

var mstart = null;

var usrfns = {
	"clear": function() {
		if( !confirm( "Are you sure? There might be valuable information here..." ) )
			return;

		current_drawing = {
			strokes: [],
			links: [],
			text: []
		}
		redraw( drawings_ctx, current_drawing );
	},
	"undo": function() {
		current_drawing.strokes.splice( current_drawing.strokes.length - 1, 1 );
		redraw( drawings_ctx, current_drawing );
	},
	"back": function() {
		window.history.back();
	},
	"mode.edit_links": function() {
		state.mode = "edit_links";
	},
	"mode.use": function() {
		$("#links").insertAfter( "#selection" );
	},
	"mode.draw": function() {
		$("#links").insertBefore( "#drawings" );
	}
}

function redraw( ctx/*ontext*/, d/*rawing*/ ) {
	ctx.clearRect( 0,0, desiredWidth,desiredHeight );
/*
	drawings_ctx.beginPath();
	for( var i in current_drawing.lines ) {
		var l = current_drawing.lines[i];
		drawings_ctx.lineTo( l[1][0], l[1][1] );
	}
*/
	for( var kk in d.strokes ) {
		ctx.beginPath();
		var str = d.strokes[kk];

		if( typeof str.start == 'null' )
			console.log( str );

		ctx.moveTo( str.start[0], str.start[1] );

		if( str.points.length <= 2 ) {
			ctx.arc( str.start[0], str.start[1], 5, 0, 2*Math.PI );
			ctx.stroke();
			continue;
		}

		for (var i = 0, len = str.points.length; i < len-1; i++) {
			// we pick the point between pi+1 & pi+2 as the
			// end point and p1 as our control point
			var p1=str.points[i];
			var p2=str.points[i+1];

			ctx.quadraticCurveTo(p1[0], p1[1], (p1[0]+p2[0])/2, (p1[1]+p2[1])/2);
		}
		var lastPt = str.points[ str.points.length-1 ];
		ctx.lineTo( lastPt[0], lastPt[1] );
		ctx.stroke();

	}

	$("#links").html("");

	for( var i in d.links ) {
		try {
			var l = d.links[i];
			var $caption = $("<div>").css( "top", l.c2[1] - l.c1[1] ).text( d.links[i].to );

			var $link = $("<div>").addClass( "link" ).css( {
				"left": l.c1[0],
				"top": l.c1[1],
				"width": l.c2[0] - l.c1[0],
				"height": l.c2[1] - l.c1[1]
			} ).appendTo( "#links" );

			$link.append( $caption );

			$link.mousedown( ( function( to, index ) {
				return function( e ) {
					if( state.mode == "edit_links" ) {
						//#delete d.links[index];
					}

					e.stopPropagation();
					e.preventDefault();
					if( to[0] == "." ) {
						if( typeof usrfns[ to.substring( 1 ) ] != 'undefined' )
							usrfns[ to.substring( 1 ) ]();
					} else
						location.href = location.href.split( "#" )[0] + "#" + to;
				};
			} )( d.links[i].to, i ) );
		} catch (e) {
			//#delete loadmenu.links[i];
			redraw( c, d );
		}
	}

	ctx.font = "15px Arial";
	for( var i in d.text ) {
		var tx = d.text[i];
		wrapText( ctx, tx.tx, tx.corner[0], tx.corner[1], tx.width, tx.size );
	}
}

function distance( p1, p2 ) {
	return Math.pow( Math.pow( p1[0]-p2[0], 2 ) + Math.pow( p1[1]-p2[1], 2 ), .5 );
}

//NOT USED ANYMORE {{{{
function popupmenu() {
	$("#menu").toggle( true ).css( {
		"left": state.pos[0] - 50,
		"top": state.pos[1] - 50
	} );

	$(document).off( "mouseup.menugoaway" );
	$(document).on( "mouseup.menugoaway", 
		function() {
			$("#menu").toggle( false );
		}
	);

	//Stop drawing and get rid of what was already drawn
	state.mode = null;
	current_drawing.strokes.splice( current_drawing.strokes.length - 1, 1 );
	redraw( drawings_ctx, current_drawing );
};
//}}}}

$("#selection").mousedown( function( e ) {
	if( state.mode == 'drawing' ) {
		var T = setTimeout( function() {
			var len = current_drawing.strokes.length;
			var current_stroke = current_drawing.strokes[ len-1 ];
			for( var i in current_stroke.points )
				if( distance( current_stroke.points[i], state.pos ) > 5 )
					return;

			mstart = state.pos;
			state.mode = "selecting";
		}, 300 );

		$("#selection").off( "mouseup.wait" );

		$("#selection").on( "mouseup.wait", 
			function() {
				window.clearInterval( T );
			}
		);
	}

	state.btn = true;
	state.mousemoves = 0;

	if( e.shiftKey ) {
		var $text = $("<textarea>").addClass( "floating" ).css( {
			"left": state.pos[0],
			"top": state.pos[1]+50,
			"font": "15px Arial"
		} );
		var _savepos = [ state.pos[0]+4, state.pos[1]+17 ];
		$text.keydown( function(e) {
			console.log( e );
			if( e.keyCode == 13 && e.shiftKey ) {
				current_drawing.text.push( {
					tx: $text.val(),
					corner: _savepos,
					width: $text.width(),
					size: 15
				} );

				$text.remove();
				redraw( drawings_ctx, current_drawing );
			}
		} );
		$text.appendTo( document.body );
	} else if( e.button == 2 ) {
		mstart = state.pos;
		state.mode = "selecting";
		return false;
	} else {
		current_drawing.strokes.push( {
			points: [state.pos],
			start: state.pos
		} );

		drawings_ctx.beginPath();
		drawings_ctx.moveTo( state.pos[0], state.pos[1] );
		state.mode = "drawing";
	}
} );

function inRect( p, c1, c2 ) {
	var xmin = Math.min( c1[0], c2[0] );
	var ymin = Math.min( c1[1], c2[1] );
	var xmax = Math.max( c1[0], c2[0] );
	var ymax = Math.max( c1[1], c2[1] );
	if( p[0] < xmax && p[0] > xmin &&
		p[1] < ymax && p[1] > ymin )
			return true;
	return false;
}

$("#selection").mouseup( function( e ) {
	state.btn = false;

	//Create a new drawing and place it inside this one
	if( state.mode == "selecting" ) {
		stop_selecting();

		//What's going on?
		var newc = $("<canvas>").appendTo( "body" ).css( {
			"position": "absolute",
			"top": "100px",
			"left": "100px",
			"border": "1px solid",
			"background-color": "white"
		} ).attr( {
			"width": "400px",
			"height": "400px"
		} );

		var newctx = newc[0].getContext( "2d" );

		redraw( newctx, loadDrawing( "boxmenu" ) );

		var link = prompt( "Where would you like to link to?" );

		if( link == null ) return;

		upperleft = [ 
			Math.min( mstart[0], state.pos[0] ), 
			Math.min( mstart[1], state.pos[1] )
		];
		lowerright = [ 
			Math.max( mstart[0], state.pos[0] ), 
			Math.max( mstart[1], state.pos[1] )
		];

		current_drawing.links.push( {
			to: link,
			c1: upperleft,
			c2: lowerright
		} );
	} else if( state.mode == "drawing" ) {

		var len = current_drawing.strokes.length;
		current_drawing.strokes[len-1].points.push( state.pos );

		console.log( current_drawing.strokes[len-1] );

	}

	redraw( drawings_ctx, current_drawing );

	e.preventDefault();
	e.stopPropagation();
} );

$(document.body).keypress( function(e) {
	if( e.keyCode == 43 && e.shiftKey ) {
		console.log( "You hit +" );
	}
} );

$(document.body).mousemove( function( e ) {
	//Skip every other one
	state.mousemoves ++;

	state.pos = [ e.clientX, e.clientY - 50 ];

} );

$(document.body).mouseleave( function( e ) {
	//You can't be selecting if your mouse isn't down
	if( state.mode == 'selecting' )
		stop_selecting();
} );

setInterval( function() {
	if( state.mode == "drawing" && state.btn ) {
		var len = current_drawing.strokes.length;
		if( len > 0 ) {
			var lenlen = current_drawing.strokes[len-1].points.length;
			if( lenlen > 0 ) {
				var last = current_drawing.strokes[len-1].points[lenlen-1];
				var moved = Math.pow( Math.pow( state.pos[0] - last[0], 2 ) + Math.pow( state.pos[1] - last[1], 2 ), .5 );
				//console.log( moved );
			}
			current_drawing.strokes[len-1].points.push( state.pos );
			redraw( drawings_ctx, current_drawing );
		}
	} else if( state.mode == "selecting" && state.btn ) {
		selection_ctx.beginPath();
		selection_ctx.clearRect( 0,0, desiredWidth,desiredHeight );

		upperleft = [ 
			Math.min( mstart[0], state.pos[0] ), 
			Math.min( mstart[1], state.pos[1] )
		];
		lowerright = [ 
			Math.max( mstart[0], state.pos[0] ), 
			Math.max( mstart[1], state.pos[1] )
		];

		selection_ctx.rect( 
			upperleft[0], 
			upperleft[1], 
			lowerright[0]-upperleft[0], 
			lowerright[1]-upperleft[1]
		);
		selection_ctx.stroke();
		selection_ctx.fill();
	}

}, 30 )

var loc = location.href;
setInterval( function() {
	if( location.href != loc ) {
		//Initialize the drawing
		current_drawing = {
			strokes: [],
			links: []
		}

		//Load from localStorage if exists.
		if( typeof localStorage[ location.href.split( "#" )[1] ] != 'undefined' )
			current_drawing = $.parseJSON( localStorage[ location.href.split( "#" )[1] ] );

		redraw( drawings_ctx, current_drawing );
		loc = location.href;
	}
}, 500 );

setInterval( function() {
	if( loc != location.href )
		return;
	localStorage[ loc.split("#")[1] ] = JSON.stringify( current_drawing );
}, 1000 );

redraw( drawings_ctx, current_drawing );
