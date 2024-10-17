// debug with extreme prejudice
"use strict"

// Contants:
const MAP_WIDTH = 30;
const TILE_WIDTH = 64;

// TID = "tile ID", BR = "bottom right", LM = "left middle", TL = "top left", etc.
const BLANK_TID = 195;		// blank
const WATER_TID = 56;		// water
const GRASS_TID = 40;		// grass
const GRASS_BR_TID = 11;
const GRASS_BM_TID = 25;
const GRASS_BL_TID = 39;
const GRASS_TR_TID = 41;
const GRASS_TM_TID = 55;
const GRASS_TL_TID = 69;
const GRASS_RM_TID = 26;
const GRASS_LM_TID = 54;
const DIRT_TID = 175;		// dirt
const DIRT_BR_TID = 146;
const DIRT_BM_TID = 160;
const DIRT_BL_TID = 174;
const DIRT_TR_TID = 176;
const DIRT_TM_TID = 190;
const DIRT_TL_TID = 9;
const DIRT_RM_TID = 161;
const DIRT_LM_TID = 189;


let config = {
	parent: 'phaser-game',
	type: Phaser.CANVAS,
	width: 30 * 64,
	height: 30 * 64,
	zoom: 0.25,
	autoCenter: true,
	render: {
		pixelArt: true 		// prevent pixel art from getting blurred when scaled
	},
	scene: [mapgeneration]
}

const game = new Phaser.Game(config);