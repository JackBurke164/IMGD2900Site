/*
game.js for Perlenspiel 3.3.x
Last revision: 2022-03-15 (BM)

Perlenspiel is a scheme by Professor Moriarty (bmoriarty@wpi.edu).
This version of Perlenspiel (3.3.x) is hosted at <https://ps3.perlenspiel.net>
Perlenspiel is Copyright © 2009-22 Brian Moriarty.
This file is part of the standard Perlenspiel 3.3.x devkit distribution.

Perlenspiel is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Perlenspiel is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You may have received a copy of the GNU Lesser General Public License
along with the Perlenspiel devkit. If not, see <http://www.gnu.org/licenses/>.
*/

/*
This JavaScript file is a template for creating new Perlenspiel 3.3.x games.
Any unused event-handling function templates can be safely deleted.
Refer to the tutorials and documentation at <https://ps3.perlenspiel.net> for details.
*/

/*
The following comment lines are for JSHint <https://jshint.com>, a tool for monitoring code quality.
You may find them useful if your development environment is configured to support JSHint.
If you don't use JSHint (or are using it with a configuration file), you can safely delete these two lines.
*/

/* jshint browser : true, devel : true, esversion : 6, freeze : true */
/* globals PS : true */

"use strict"; // Do NOT remove this directive!

/*
PS.init( system, options )
Called once after engine is initialized but before event-polling begins.
This function doesn't have to do anything, although initializing the grid dimensions with PS.gridSize() is recommended.
If PS.grid() is not called, the default grid dimensions (8 x 8 beads) are applied.
Any value returned is ignored.
[system : Object] = A JavaScript object containing engine and host platform information properties; see API documentation for details.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

// The global G variable creates a namespace
// for game-specific code and variables

// It is initialized with an immediately-invoked
// function call (described below)

let G = ( function () {
	// By convention, constants are all upper-case

	let WIDTH = 9; // width of grid
	let HEIGHT = 9; // height of grid

	let COLOR_PLAYER = PS.COLOR_GREEN; // player color
	let COLOR_ENEMY = PS.COLOR_BLACK; // enemy color
	let COLOR_BORDER = PS.COLOR_GRAY; // border color
	let COLOR_FLOOR = PS.COLOR_WHITE; // floor color

	// The following variables are player-related,
	// so they start with 'p'

	let p_x = 1; // current x-pos of player
	let p_y = 4; // current y-pos of player
	let pHasBall = false; // does player have ball? 
	let pScore = 0;
	
	// The following variables are enemy-related,
	// so they start with 'e'

	let e_x = 7; // current x-pos of enemy
	let e_y = 4; // current y-pos of enemy
	let eHasBall = true;
	let eScore = 0;
	
	// The following variables are ball-related,
	// so they start with 'b'
	
	let b_x = e_x;
	let b_y = e_y;
	let eCanPickUp = false;
	let pCanPickUp = false;
	
	

	// The 'exports' object is used to define
	// variables and/or functions that need to be
	// accessible outside this function.
	
	let exports = {
		
		moveEnemy : function() {
			
			let v = 0;
			let h = 0;
			
			if(eHasBall) {
				if(p_y > e_y) {
					v = 1;
				}
				else if(p_y < e_y) {
					v = -1;
				}
				else {
					h = -1;
				}
				
			}
			else if (pHasBall){
				if(p_y > e_y) {
					v = -1;
				}
				else if(p_y < e_y) {
					v = 1;
				}
				else {
					h = 1;
				}
			}
			else if(eCanPickUp) {
				if(e_x < b_x) {
					h = 1;
				}
				else if(e_y < b_y) {
					v = 1;
				}
				else if(e_y > b_y) {
					v = -1;
				}
			}
			else {
				let m = PS.random(4);
			
				switch(m) {
					case 1:
						v = -1;
						break;
					case 2:
						v = 1;
						break;
					case 3:
						h = -1;
						break;
					case 4:
						h = 1;
						break;
				}	
			}
			
			let nx = e_x + h;
			let ny = e_y + v;
			
			if ( ( nx < 0 ) || ( nx >= WIDTH ) || ( ny < 0 ) || ( ny >= HEIGHT ) ) {
				return;
			}
			
			if(PS.color(nx, ny) == COLOR_BORDER) {
				return;
			}
			
			PS.color(e_x, e_y, COLOR_FLOOR);
			PS.color(nx, ny, COLOR_ENEMY);
			if(eHasBall) {
				PS.glyph(e_x, e_y, "");
				PS.glyph(nx, ny, "o");
				PS.glyphColor(nx, ny, PS.COLOR_RED);
				b_x = nx;
				b_y = ny;
			}
			
			e_x = nx;
			e_y = ny;
			
			if(e_x == b_x && e_y == b_y && eCanPickUp) {
				eHasBall = true;
				eCanPickUp = false;
			}
			
		},
		
		enemyThrow : function() {
			if(!eHasBall) {
				return;
			}
			eHasBall = false;
			
			
			let throwTimer = PS.timerStart(10, () => {
				if(b_x <= 0) {
					PS.timerStop(throwTimer);
					pCanPickUp = true;
					
					return;
				}
				
				PS.glyph(b_x, b_y, "");
				PS.glyph(b_x-1, b_y, "o");
				PS.glyphColor(b_x-1, b_y, PS.COLOR_RED);
				
				if(PS.color(b_x-1, b_y) == COLOR_PLAYER) {
					
					eScore++;
					PS.statusText("Score: Player " + pScore + "/3, Enemy " + eScore + "/3");
					
					if(eScore >= 3) {
						PS.timerStop(throwTimer);
						PS.timerStop(G.eMoveTimer);
						PS.timerStop(G.eThrowTimer);
						G.gameOver = true;
						PS.statusText("Game Over! You lose!");
					}
				}
				
				b_x--;
			} );
			
			
		},

		// G.init()
		// Initializes the game

		init : function () {
			PS.gridSize( WIDTH, HEIGHT ); // init grid

			for(let i = 0; i < 9; i++) {
				PS.color(4, i, COLOR_BORDER);
			}

			// Place player and enemy at initial position

			PS.color( p_x, p_y, COLOR_PLAYER );
			PS.color( e_x, e_y, COLOR_ENEMY );
			PS.glyph( e_x, e_y, "o");
			PS.glyphColor( e_x, e_y, PS.COLOR_RED);
			
			let gameOver = false;
			
			PS.statusText( "Press Space to throw a dodgeball!" );
			
			G.eMoveTimer = PS.timerStart( 60, G.moveEnemy );
			G.eThrowTimer = PS.timerStart( 180, G.enemyThrow );
		},
		
		move : function(h,v) {
			
			let nx = p_x + h;
			let ny = p_y + v;
			
			if ( ( nx < 0 ) || ( nx >= WIDTH ) || ( ny < 0 ) || ( ny >= HEIGHT ) ) {
				return;
			}
			
			if(PS.color(nx, ny) == COLOR_BORDER) {
				return;
			}
			
			PS.color(p_x, p_y, COLOR_FLOOR);
			PS.color(nx, ny, COLOR_PLAYER);
			if(pHasBall) {
				PS.glyph(p_x, p_y, "");
				PS.glyph(nx, ny, "o");
				PS.glyphColor(nx, ny, PS.COLOR_RED);
				b_x = nx;
				b_y = ny;
			}
			
			p_x = nx;
			p_y = ny;
			
			if(p_x == b_x && p_y == b_y && pCanPickUp) {
				pHasBall = true;
				pCanPickUp = false;
			}
		},
		
		playerThrow : function() {
			if(!pHasBall) {
				return;
			}
			pHasBall = false;
			
			let throwTimer = PS.timerStart(10, () => {
				if(b_x >= 8) {
					PS.timerStop(throwTimer);
					
					eCanPickUp = true;
					
					return;
				}
				
				PS.glyph(b_x, b_y, "");
				PS.glyph(b_x+1, b_y, "o");
				PS.glyphColor(b_x+1, b_y, PS.COLOR_RED);
				
				if(PS.color(b_x+1, b_y) == COLOR_ENEMY) {
					pScore++;
					PS.statusText("Score: Player " + pScore + "/3, Enemy " + eScore + "/3");
					
					if(pScore >= 3) {
						PS.timerStop(throwTimer);
						PS.timerStop(G.eMoveTimer);
						PS.timerStop(G.eThrowTimer);
						G.gameOver = true;
						PS.statusText("Game Over! You win!");
					}
				}
				
				b_x++;
			} );
			
			
		}
		
		
	};

 // Return the 'exports' object as the value
 // of this function, thereby assigning it
 // to the global G variable. This makes
 // its properties visible to Perlenspiel.

	return exports;
} () );

// Tell Perlenspiel to use our G.init() function
// to initialize the game

PS.init = function( system, options ) {
	G.init();
};



/*
PS.keyDown ( key, shift, ctrl, options )
Called when a key on the keyboard is pressed.
This function doesn't have to do anything. Any value returned is ignored.
[key : Number] = ASCII code of the released key, or one of the PS.KEY_* constants documented in the API.
[shift : Boolean] = true if shift key is held down, else false.
[ctrl : Boolean] = true if control key is held down, else false.
[options : Object] = A JavaScript object with optional data properties; see API documentation for details.
*/

PS.keyDown = function( key, shift, ctrl, options ) {
	// Uncomment the following code line to inspect first three parameters:

	// PS.debug( "PS.keyDown(): key=" + key + ", shift=" + shift + ", ctrl=" + ctrl + "\n" );

	// Add code here for when a key is pressed.
	
	if(G.gameOver) {
		return;
	}
	
	switch ( key ) {
		case PS.KEY_ARROW_UP:
		case 119:
		case 87: {
			// Code to move things UP
			G.move(0, -1);
			break;
		}
		case PS.KEY_ARROW_DOWN:
		case 115:
		case 83: {
			// Code to move things DOWN
			G.move(0,1);
			break;
		}
		case PS.KEY_ARROW_LEFT:
		case 97:
		case 65: {
			// Code to move things LEFT
			G.move(-1,0);
			break;
		}
		case PS.KEY_ARROW_RIGHT:
		case 100:
		case 68: {
			// Code to move things RIGHT
			G.move(1,0);
			break;
		}
		case PS.KEY_SPACE: {
			G.playerThrow();
			break;
		}
	}
	
};


