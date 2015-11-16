var draw = {};

//Keep track of mouse movement all the time
draw.mouse = {
	pos: [],
	btn: false,
	num: 0
};

setInterval( function() {
	for( var i in draw.pads )
		draw.pads[i].save();
}, 500 );

draw.util = {};

draw.util.distance = function ( p1, p2 ) {
	return Math.pow( Math.pow( p1[0]-p2[0], 2 ) + Math.pow( p1[1]-p2[1], 2 ), .5 );
}

draw.util.load = function( name ) {
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

draw.util.wrapText = function(context, text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';

	for(var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = context.measureText(testLine);
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

draw.pads = [];

setInterval( function() {
	for( var i in draw.pads ) {
		var pad = draw.pads[i];
		if( pad.mode == "drawing" && draw.mouse.btn ) {
			var len = pad.obj.strokes.length;
			if( len > 0 ) {
				var lenlen = pad.obj.strokes[len-1].points.length;
				if( lenlen > 0 ) {
					var last = pad.obj.strokes[len-1].points[lenlen-1];
					var moved = Math.pow( Math.pow( draw.mouse.pos[0] - last[0], 2 ) + Math.pow( draw.mouse.pos[1] - last[1], 2 ), .5 );
				}
				pad.obj.strokes[len-1].points.push( [
					draw.mouse.pos[0] - pad.pref.pos[0],
					draw.mouse.pos[1] - pad.pref.pos[1]
				] );
				pad.redraw();
			}
		} else if( pad.mode == "selecting" && draw.mouse.btn ) {
			pad.ctx.select.beginPath();
			pad.ctx.select.clearRect( 0,0, pad.dimensions[0], pad.dimensions[1] );

			var shifted_m = [
				draw.mouse.pos[0] - pad.pref.pos[0],
				draw.mouse.pos[1] - pad.pref.pos[1]
			];

			upperleft = [ 
				Math.min( pad.mstart[0], shifted_m[0] ), 
				Math.min( pad.mstart[1], shifted_m[1] )
			];
			lowerright = [ 
				Math.max( pad.mstart[0], shifted_m[0] ), 
				Math.max( pad.mstart[1], shifted_m[1] )
			];

			pad.ctx.select.rect( 
				upperleft[0], 
				upperleft[1], 
				lowerright[0]-upperleft[0], 
				lowerright[1]-upperleft[1]
			);
			pad.ctx.select.stroke();
			pad.ctx.select.fill();
		}
	}

}, 30 );

$(document).mousemove( function(e) {
	draw.mouse.num++;
	draw.mouse.pos = [ e.clientX, e.clientY ];
} );

$(document).mousedown( function() {
	draw.mouse.btn = true;
} );

$(document).mouseup( function( e ) {
	draw.mouse.btn = false;

	for( var i in draw.pads ) {
		var pad = draw.pads[i];

		var shifted_m = [
			draw.mouse.pos[0] - pad.pref.pos[0],
			draw.mouse.pos[1] - pad.pref.pos[1]
		];

		//Create a new drawing and place it inside this one
		if( pad.mode == "selecting" ) {

			var shifted_m = [
				draw.mouse.pos[0] - pad.pref.pos[0],
				draw.mouse.pos[1] - pad.pref.pos[1]
			];

			upperleft = [ 
				Math.min( pad.mstart[0], shifted_m[0] ), 
				Math.min( pad.mstart[1], shifted_m[1] )
			];
			lowerright = [ 
				Math.max( pad.mstart[0], shifted_m[0] ), 
				Math.max( pad.mstart[1], shifted_m[1] )
			];

			//What's going on?
			var newc = new draw.pad( {
				width: lowerright[0] - upperleft[0],
				height: lowerright[1] - upperleft[1],
				pos: [
					upperleft[0] + pad.pref.pos[0],
					upperleft[1] + pad.pref.pos[1]
				]
			} );

			newc.load( "newboxmenu" );

		} else if( pad.mode == "drawing" ) {

			var len = pad.obj.strokes.length;
			pad.obj.strokes[len-1].points.push( shifted_m );

			console.log( pad.obj.strokes[len-1] );

		}

		//Revert the state
		draw.pads[i].mode = "use";

		//Update the drawing
		draw.pads[i].redraw();
	}


	e.preventDefault();
	e.stopPropagation();
} );

$( window ).resize( function() {
	for( var i in draw.pads )
		draw.pads[i].update_dimensions();
} );
