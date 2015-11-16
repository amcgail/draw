draw.pad = function( pref ) {
	var _this = this;

	this.pref = $.extend( true, {
		"width": 100,
		"height": 100,
		"pos": [50,50],
		"css": {
			"border": "1px solid",
			"position": "fixed",
			"overflow": "hidden"
		},
		"container": "body"
	}, pref );

	this.pref.css['left'] = this.pref.pos[0] + "px";
	this.pref.css['top'] = this.pref.pos[1] + "px";

	this.$cont = $("<div>")
		.appendTo( this.pref.container );

	this.$draw = $("<canvas>")
		.css( this.pref.css )
		.css( "background-color", "white" )
		.appendTo( this.$cont );

	this.$select = $("<canvas>")
		.css( this.pref.css )
		.appendTo( this.$cont );

	this.$links = $("<div>")
		.css( this.pref.css )
		.appendTo( this.$cont );

	this.update_dimensions();

	this.mode = "use";
	this.mousemoved = false;

	this.$cont.mousedown( function( e ) {
		var shifted_m = [
			draw.mouse.pos[0] - _this.pref.pos[0],
			draw.mouse.pos[1] - _this.pref.pos[1]
		];

		var T = setTimeout( function() {
			var shifted_m = [
				draw.mouse.pos[0] - _this.pref.pos[0],
				draw.mouse.pos[1] - _this.pref.pos[1]
			];

			var len = _this.obj.strokes.length;
			var current_stroke = _this.obj.strokes[ len-1 ];
			for( var i in current_stroke.points )
				if( draw.util.distance( current_stroke.points[i], shifted_m ) > 10 )
					return;

			_this.mstart = shifted_m;
			_this.mode = "selecting";
		}, 300 );

		$(document).off( "mouseup.wait" );

		$(document).on( "mouseup.wait", 
			function() {
				window.clearInterval( T );
			}
		);

		_this.mousemoves = 0;

		if( e.shiftKey ) {
			var $text = $("<textarea>").addClass( "floating" ).css( {
				//Absolute coordinates
				"left": draw.mouse.pos[0],
				"top": draw.mouse.pos[1]+50,
				"font": "15px Arial"
			} );
			var _savepos = [ draw.mouse.pos[0]+4, draw.mouse.pos[1]+17 ];
			$text.keydown( function(e) {
				if( e.keyCode == 13 && e.shiftKey ) {
					_this.obj.text.push( {
						tx: $text.val(),
						corner: _savepos,
						width: $text.width(),
						size: 15
					} );

					$text.remove();
					_this.redraw();
				}
			} );
			$text.appendTo( document.body );
		} else if( e.button == 2 ) {
			_this.mstart = shifted_m;
			_this.mode = "selecting";
			return false;
		} else {
			_this.obj.strokes.push( {
				points: [shifted_m],
				start: shifted_m
			} );

			_this.ctx.draw.beginPath();
			_this.ctx.draw.moveTo( draw.mouse.pos[0], draw.mouse.pos[1] );
			_this.mode = "drawing";
			_this.redraw();
		}
	} );


	this.ctx = {
		"draw": this.$draw[0].getContext( "2d" ),
		"select": this.$select[0].getContext( "2d" )
	};

	this.ctx.select.strokeStyle = '#00fdcb';
	this.ctx.select.fillStyle = "rgba( 80, 80, 80, .20 )";

	//Keeping track of history
	this.current_location = null;
	this.browse_history = [];
	this.browse_history_i = null;

	//Create all the canvas functions for the draw ctx
	var opts = ['strokeStyle', 'lineWidth'];
	for( var i in opts ) {
		this['canvas.' + opts[i]] = ( function(opt) {
			return function( x ) {
				_this.ctx.draw[opt] = x;
			};
		} )( opts[i] );
	}

	//Global knowledge of what pads exist
	draw.pads.push( this );
}

draw.pad.prototype.update_dimensions = function() {
	var fw = $(window).width();
	var fh = $(window).height();

	this.dimensions = [
		eval( this.pref.width ),
		eval( this.pref.height )
	];

	this.$draw
		.attr( {
			"width": this.dimensions[0],
			"height": this.dimensions[1]
		} );
	this.$select
		.attr( {
			"width": this.dimensions[0],
			"height": this.dimensions[1]
		} );
	this.$links
		.css( {
			"width": this.dimensions[0],
			"height": this.dimensions[1]
		} );
}

draw.pad.prototype.clear = function() {
	if( !confirm( "Are you sure? There might be valuable information here..." ) )
		return;

	this.obj = {
		strokes: [],
		links: [],
		text: []
	}

	this.redraw();
};

//Could make this more general. Just store the whole image in history objects and do like browser history
draw.pad.prototype.undo = function() {
	var num_s = this.obj.strokes.length;

	this.obj.strokes.splice( num_s - 1, 1 );
	this.redraw();
};
/*

draw.pad.prototype.back = function() {
	if( this.browse_history_i == null )
		return;

	this.browse_history_i -= 1;
	this.browse_history_i = Math.max( 0, this.browse_history_i );

	this.load( this.browse_history[ this.browse_history_i ] );
}
more user functions****:::

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


draw.pad.prototype.history_snap = function() {
	this.browse_history_i 
}
*/

draw.pad.prototype.load = function( loc ) {
	this.current_location = loc;

	this.obj = draw.util.load( loc );
	this.redraw();
}

draw.pad.prototype.save = function() {
	localStorage[ this.current_location ] = JSON.stringify( this.obj );
}

draw.pad.prototype.redraw = function() {
	this.ctx.draw.clearRect( 0,0, this.dimensions[0], this.dimensions[1] );

	for( var kk in this.obj.strokes ) {
		this.ctx.draw.beginPath();
		var str = this.obj.strokes[kk];

		this.ctx.draw.moveTo( str.start[0], str.start[1] );

		if( str.points.length <= 2 ) {
			this.ctx.draw.arc( str.start[0], str.start[1], 5, 0, 2*Math.PI );
			this.ctx.draw.stroke();
			continue;
		}

		for (var i = 0, len = str.points.length; i < len-1; i++) {
			// we pick the point between pi+1 & pi+2 as the
			// end point and p1 as our control point
			var p1=str.points[i];
			var p2=str.points[i+1];

			this.ctx.draw.quadraticCurveTo(p1[0], p1[1], (p1[0]+p2[0])/2, (p1[1]+p2[1])/2);
		}
		var lastPt = str.points[ str.points.length-1 ];
		this.ctx.draw.lineTo( lastPt[0], lastPt[1] );
		this.ctx.draw.stroke();

	}

	this.$links.html("");

	var _this = this;

	for( var i in this.obj.links ) {
		try {
			var l = this.obj.links[i];
			var $caption = $("<div>").css( "top", l.c2[1] - l.c1[1] ).text( this.obj.links[i].to );

			var $link = $("<div>").addClass( "link" ).css( {
				"left": l.c1[0],
				"top": l.c1[1],
				"width": l.c2[0] - l.c1[0],
				"height": l.c2[1] - l.c1[1]
			} ).appendTo( this.$links );

			$link.append( $caption );

			$link.mousedown( ( function( to, index ) {
				return function( e ) {
					/*
					if( state.mode == "edit_links" ) {
						//#delete this.obj.links[index];
					}
					*/
					e.stopPropagation();
					e.preventDefault();

					if( to[0] == "." ) {
						args = to.substring( 1 ).split( " " );
						if( typeof _this.__proto__[ args[0] ] != 'undefined' ) {
							_this.__proto__[ to.substring( 1 ) ].apply( _this, args.splice(1) ) ;
						}
					} else
						_this.load( to );
				};
			} )( this.obj.links[i].to, i ) );
		} catch (e) {
			//#delete loadmenu.links[i];
			this.redraw();
		}
	}

	this.ctx.draw.font = "15px Arial";
	for( var i in this.obj.text ) {
		var tx = this.obj.text[i];
		draw.util.wrapText( this.ctx.draw, tx.tx, tx.corner[0], tx.corner[1], tx.width, tx.size );
	}
}

