class mapgeneration extends Phaser.Scene
{

	// Methods:
	constructor() {
		super("mapgenerationscene");
	}

	preload()
	{
		// Set load path and load map pack
		this.load.path = './assets/';
		this.load.image("map pack", "mapPack_spritesheet.png");
	}

	create()
	{
		this.MAP_WIDTH = 30;
		this.TILE_WIDTH = 64;

		this.BLANK = 195;		// blank
		this.WATER = 56;		// water
		this.GRASS = 40;		// grass
		this.GRASS_BR = 11;
		this.GRASS_BM = 25;
		this.GRASS_BL = 39;
		this.GRASS_TR = 41;
		this.GRASS_TM = 55;
		this.GRASS_TL = 69;
		this.GRASS_RM = 26;
		this.GRASS_LM = 54;
		this.DIRT = 175;		// dirt
		this.DIRT_BR = 146;
		this.DIRT_BM = 160;
		this.DIRT_BL = 174;
		this.DIRT_TR = 176;
		this.DIRT_TM = 190;
		this.DIRT_TL = 9;
		this.DIRT_RM = 161;
		this.DIRT_LM = 189;

		this.CIRCLETREE = 103;


		this.xOffset = 0;				
		this.yOffset = 0;				
		this.frequency = 0.105;		
		this.fbmEnabled = true;		
		this.numOctaves = 4;				
		this.rtf = 1;				
		this.textureEnabled = false;

		// Map Parameters:
		this.waterWeight = 2;
		this.grassWeight = 1;
		this.dirtWeight = 1;


		// Control Parameters:
		this.largeOffsetChange = 5;
		this.smallOffsetChange = 1;
		this.largeFrequencyChange = 0.1;
		this.smallFrequencyChange = 0.01;
		//Variables


		// Initialize things
		this.initializeVariables();
		this.initializeControls();

		// Set noise seed
		noise.seed(Math.random());

		this.generateDecorationData();
		// Generate initial map/texture
		this.generate();

		this.grammar = tracery.createGrammar({
			townName: [
			  "#prefix##suffix#",
			  "#prefix##name#",
			  "#adjective# #place#",
			  "#name##suffix#",
			],
			prefix: [
			  "San",
			  "Green",
			  "Silver",
			  "Red",
			  "Iron",
			  "Santa",
			  "New",
			  "Old",
			  "East",
			  "West",
			  "North",
			  "South",
			  "Port",
			  "Saint",
			  "Fort",
			  "Mount",
			  "Spring",
			  "Summer",
			  "Winter",
			  "Autumn",
			  "Golden",
			  "Crystal",
			  "Emerald",
			  "Ruby",
			  "Sapphire",
			  "Diamond",
			  "Pearl",
			  "Lavender",
			],
			suffix: [
			  "town",
			  "vale",
			  "burg",
			  "ridge",
			  "haven",
			  "ford",
			  "ham",
			  "ton",
			  "field",
			  "wood",
			  "bridge",
			  "port",
			  "mouth",
			],
			adjective: [
			  "Lonely",
			  "Silent",
			  "Forgotten",
			  "Shimmering",
			  "Windy",
			  "Breezy",
			  "Sunny",
			  "Rainy",
			  "Misty",
			  "Foggy",
			  "Snowy",
			  "Icy",
			  "Hot",
			  "Cold",
			  "Warm",
			  "Gloomy",
			  "Dark",
			  "Bright",
			  "Glowing",
			  "Shining",
			  "Dusty",
			  "Sandy",
			  "Rocky",
			  "Muddy",
			  "Leafy",
			  "Flowery",
			  "Grassy",
			  "Mossy",
			  "Soggy",
			  "Dry",
			  "Wet",
			  "Damp",
			  "Chilly",
			  "Cool",
			  "Stormy",
			  "Calm",
			  "Peaceful",
			  "Quiet",
			  "Busy",
			  "Active",
			  "Sleepy",
			],
			place: ["Atoll", "Peak", "Valley", "Shore", "Island"],
			name: [
			  "Haven",
			  "Wood",
			  "Bridge",
			  "Field",
			  "Grove",
			  "Cruz",
			  "Barbara",
			  "Diego",
			],
		  });
	}

	initializeVariables()
	{
		// Perlin data
		this.perlinData = [];		// contains the values returned by the perlin noise function
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.perlinData[y] = [];
		}

		// Total weight
		this.totalWeight = this.waterWeight + this.grassWeight + this.dirtWeight;		// used to determine the tileIDs for mapData

		// Map data, Maps, Tileset, and Laysers
		this.mapData = [];		// contains the blocky tileIDs derived from the perlin data; used to generate grass and dirt maps
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.mapData[y] = [];
		}
		this.waterData = [];		// just a world of water
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.waterData[y] = [];
			for (let x = 0; x < MAP_WIDTH; x++) {
				this.waterData[y][x] = WATER_TID;
			}
		}
		this.waterMap = this.make.tilemap({
			data: this.waterData,
			tileWidth: TILE_WIDTH,
			tileHeight: TILE_WIDTH
		});
		this.tileset = this.waterMap.addTilesetImage("map pack");		// can use this for the other maps too
		this.waterLayer = this.waterMap.createLayer(0, this.tileset, 0, 0);
		this.grassData = [];	// contains the blocky and transitional tileIDs for grass derived from mapData
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.grassData[y] = [];
		}
		this.grassMap = null;
		this.dirtData = [];		// contains the blocky and transitional tileIDs for dirt derived from mapData
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.dirtData[y] = [];
		}
		this.dirtMap = null;

		// Decoration data
        this.decorationData = [];
        for (let y = 0; y < this.MAP_WIDTH; y++) {
            this.decorationData[y] = Array(this.MAP_WIDTH).fill(this.BLANK); // Initialize as empty
        }

		this.decorationMap = this.make.tilemap({
			data: this.decorationData,
			tileWidth: this.TILE_WIDTH,
			tileHeight: this.TILE_WIDTH
		});
		
		// Texture
		this.texture = [];		// contains colored squares whose colors are derived from the perlin data
		for (let y = 0; y < MAP_WIDTH; y++) {
			this.texture[y] = [];
		}
	}

	initializeControls()
	{
		// Initialize variables
		this.startingXOffset = this.xOffset;
		this.startingYOffset = this.yOffset;
		this.startingFrequency = this.frequency;

		// Initialize input keys
		this.moveUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
		this.moveDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
		this.moveLeftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
		this.moveRightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
		this.increaseZoom = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
		this.decreaseZoom = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA);
		this.randomizeSeedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
		this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);


		// Create events
		this.moveUpKey.on("down", (key, event) => {						// move up
			if (this.shiftKey.isDown) {
				this.yOffset += this.largeOffsetChange;
			}
			else {
				this.yOffset += this.smallOffsetChange;
			}
			this.generate();
			console.log(`moved to (${this.xOffset}, ${this.yOffset})`)
		});
		this.moveDownKey.on("down", (key, event) => {					// move down
			if (this.shiftKey.isDown) {
				this.yOffset -= this.largeOffsetChange;
			}
			else {
				this.yOffset -= this.smallOffsetChange;
			}
			this.generate();
			console.log(`moved to (${this.xOffset}, ${this.yOffset})`)
		});
		this.moveLeftKey.on("down", (key, event) => {					// move left
			if (this.shiftKey.isDown) {
				this.xOffset -= this.largeOffsetChange;
			}
			else {
				this.xOffset -= this.smallOffsetChange;
			}
			this.generate();
			console.log(`moved to (${this.xOffset}, ${this.yOffset})`)
		});
		this.moveRightKey.on("down", (key, event) => {					// move right
			if (this.shiftKey.isDown) {
				this.xOffset += this.largeOffsetChange;
			}
			else {
				this.xOffset += this.smallOffsetChange;
			}
			this.generate();
			console.log(`moved to (${this.xOffset}, ${this.yOffset})`)
		});
		
		this.increaseZoom.on("down", (key, event) => {			// increase frequency

			const mapCenterXY = MAP_WIDTH / 2;
			const centerXBefore = (mapCenterXY + this.xOffset) * this.frequency;
			const centerYBefore = (mapCenterXY - this.yOffset) * this.frequency;

			if (this.shiftKey.isDown) {
				this.frequency += this.largeFrequencyChange;
			}
			else {
				this.frequency += this.smallFrequencyChange;
			}

			this.xOffset = centerXBefore / this.frequency - mapCenterXY;
			this.yOffset = -(centerYBefore / this.frequency - mapCenterXY);

			this.generate();
			console.log(`frequency = ${this.frequency}`)

		});
		this.decreaseZoom.on("down", (key, event) => {			// decrease frequency

			const mapCenterXY = MAP_WIDTH / 2;
			const centerXBefore = (mapCenterXY + this.xOffset) * this.frequency;
			const centerYBefore = (mapCenterXY - this.yOffset) * this.frequency;

			if (this.shiftKey.isDown) {
				this.frequency -= this.largeFrequencyChange;
			}
			else {
				this.frequency -= this.smallFrequencyChange;
			}

			this.xOffset = centerXBefore / this.frequency - mapCenterXY;
			this.yOffset = -(centerYBefore / this.frequency - mapCenterXY);

			this.generate();
			console.log(`frequency = ${this.frequency}`)
		});
		this.randomizeSeedKey.on("down", (key, event) => {				// randomize seed
			noise.seed(Math.random());
			this.generate();
			console.log("changed seed");
		});
	}

	generate()
	{
		//reset the map
		this.destroyMapAndTexture();

		// Generate perlin data
		this.generatePerlinData();

		// Generate map/texture
		if (this.textureEnabled)		// generate texture
		{
			this.generateTexture();
		}
		else							// generate map
		{
			this.generateMapData();
			this.generateGrassData();
			this.generateDirtData();
			this.generateDecorationData();
			this.createMap();
		}
	}


	generatePerlinData()
	{
		// Use the perlin noise function to fill perlinData
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {

				// Stack octaves of the same position to get a perlin value thats usually between [-1, 1]
				let result = 0;
				let amplitude = 1;
				let frequency = this.frequency;
				let numOctaves = this.numOctaves;
				if (!this.fbmEnabled) {
					numOctaves = 1;
				}
				for (let octave = 0; octave < numOctaves; octave++) {
					const octaveResult = amplitude * noise.perlin2((x + this.xOffset) * frequency, (y - this.yOffset) * frequency);
					result += octaveResult;
					amplitude *= 0.5;
					frequency *= 2;
				}

				// Clamp result so it's between [-1, 1]
				result = Phaser.Math.Clamp(result, -1, 1);
				
				// Transform the value to be between [0, 1]
				result = this.transformRange(result);

				// Set the element
				this.perlinData[y][x] = result;
			}
		}
	}
	transformRange(value)
	{
		if (this.rtf == 1) {
			return (value + 1) / 2;
		}
		else {
			return Math.abs(value);
		}
	}

	destroyMapAndTexture()
	{
		// Maps
		this.waterLayer.setVisible(false);
		if (this.grassMap != null) {
			this.grassMap.destroy();		// also destroys any layers
		}
		if (this.dirtMap != null) {
			this.dirtMap.destroy();			// also destroys any layers
		}

		console.log("destroyed maps");
		console.log(this.decorationMap != null);
		if (this.decorationMap != null) {
			console.log("destroying decoration map");
			this.decorationMap.destroy();			// also destroys any layers
		}

		// Texture
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				if (this.texture[y][x] != null) {
					this.texture[y][x].destroy();
				}	
			}
		}
	}

	generateTexture()
	{
		// Generate the texture by creating the squares and use the perlin data to determine their color
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {

				const value = this.perlinData[y][x];
				const colorValue = Math.floor(value * 255)
				const color = Phaser.Display.Color.GetColor(colorValue, colorValue, colorValue);
				this.texture[y][x] = this.add.rectangle(x*TILE_WIDTH, y*TILE_WIDTH, TILE_WIDTH, TILE_WIDTH, color).setOrigin(0);
			}
		}
	}

	generateMapData()
	{
		// Set constants
		const waterTileID = 56;
		const grassTileID = 40;
		const dirtTileID = 105;
		const totalWeight = this.waterWeight + this.grassWeight + this.dirtWeight;

		// Use the perlin data to set the tile type
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {

				const value = this.perlinData[y][x];
				if (value < this.waterWeight/totalWeight) {								// water
					this.mapData[y][x] = waterTileID;
				}
				else if (value < (this.waterWeight+this.grassWeight)/totalWeight) {		// grass
					this.mapData[y][x] = grassTileID;
				}
				else {																	// dirt
					this.mapData[y][x] = dirtTileID;
				}

			}
		}
	}

	generateGrassData()
	{
		// Set grassData to be mapData but only the grass
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				if (this.mapData[y][x] == WATER_TID) {
					this.grassData[y][x] = BLANK_TID;
				}
				else {
					// dirt becomes grass here so we can layer properly
					this.grassData[y][x] = GRASS_TID;
				}
			}
		}

		this.generateGrassTransitionTiles();
	}

	generateGrassTransitionTiles()
	{
		// loop over the tiles of grassData
		// for each grass tile, check if it borders water
		// if it does, then assign the right transition tile ID to the tile

		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				if (this.grassData[y][x] == GRASS_TID) {

					if (y < MAP_WIDTH-1 && this.mapData[y+1][x] == WATER_TID) {			// bottom tile
						if (x < MAP_WIDTH-1 && this.mapData[y][x+1] == WATER_TID) {		// bottom right tile
							this.grassData[y][x] = GRASS_BR_TID;
						}
						else if (x > 0 && this.mapData[y][x-1] == WATER_TID) {			// bottom left tile
							this.grassData[y][x] = GRASS_BL_TID;
						}
						else {															// bottom middle tile
							this.grassData[y][x] = GRASS_BM_TID;
						}
					}
					else if (y > 0 && this.mapData[y-1][x] == WATER_TID) {				// top tile
						if (x < MAP_WIDTH-1 && this.mapData[y][x+1] == WATER_TID) {		// top right tile
							this.grassData[y][x] = GRASS_TR_TID;
						}
						else if (x > 0 && this.mapData[y][x-1] == WATER_TID) {			// top left tile
							this.grassData[y][x] = GRASS_TL_TID;
						}
						else {															// top middle tile
							this.grassData[y][x] = GRASS_TM_TID;
						}
					}
					else if (x < MAP_WIDTH-1 && this.mapData[y][x+1] == WATER_TID) {	// right middle tile
						this.grassData[y][x] = GRASS_RM_TID;
					}
					else if (x > 0 && this.mapData[y][x-1] == WATER_TID) {				// left middle tile
						this.grassData[y][x] = GRASS_LM_TID;
					}

				}
			}
		}
	}

	generateDirtData()
	{
		// Set dirtData to be mapData but only the dirt
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				if (this.mapData[y][x] != DIRT_TID) {
					this.dirtData[y][x] = BLANK_TID;
				}
				else {
					this.dirtData[y][x] = DIRT_TID;
				}
			}
		}

		this.generateDirtTransitionTiles();
	}

	generateDirtTransitionTiles()
	{
		// loop over the tiles of dirtData
		// for each dirt tile, check if it borders a non-dirt tile
		// if it does, then assign the right transition tile ID to the tile

		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {
				const tileID = this.dirtData[y][x];
				if (tileID == DIRT_TID) {		

					if (y < MAP_WIDTH-1 && this.mapData[y+1][x] != tileID) {			// bottom tile
						if (x < MAP_WIDTH-1 && this.mapData[y][x+1] != tileID) {		// bottom right tile
							this.dirtData[y][x] = DIRT_BR_TID;
						}
						else if (x > 0 && this.mapData[y][x-1] != tileID) {				// bottom left tile
							this.dirtData[y][x] = DIRT_BL_TID;
						}
						else {															// bottom middle tile
							this.dirtData[y][x] = DIRT_BM_TID;
						}
					}
					else if (y > 0 && this.mapData[y-1][x] != tileID) {					// top tile
						if (x < MAP_WIDTH-1 && this.mapData[y][x+1] != tileID) {		// top right tile
							this.dirtData[y][x] = DIRT_TR_TID;
						}
						else if (x > 0 && this.mapData[y][x-1] != tileID) {				// top left tile
							this.dirtData[y][x] = DIRT_TL_TID;
						}
						else {															// top middle tile
							this.dirtData[y][x] = DIRT_TM_TID;
						}
					}
					else if (x < MAP_WIDTH-1 && this.mapData[y][x+1] != tileID) {		// right middle tile
						this.dirtData[y][x] = DIRT_RM_TID;
					}
					else if (x > 0 && this.mapData[y][x-1] != tileID) {					// left middle tile
						this.dirtData[y][x] = DIRT_LM_TID;
					}

				}
			}
		}
	}
	
	// Randomly place decorations
    generateDecorationData() {

        const treeProbability = 0.05; // 5% chance to place a tree on grass

        for (let y = 0; y < this.MAP_WIDTH; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                if (this.mapData[y][x] === this.GRASS) {
                    // Randomly place a tree based on probability
                    if (Math.random() < treeProbability) {
                        this.decorationData[y][x] = this.CIRCLETREE; // Place the tree on the decoration layer
                    }
                }
            }
        }

        // Redraw the decoration layer with the trees
        this.decorationLayer = this.decorationMap.createLayer(0, this.tileset, 0, 0);
    }

	createMap()
	{
		this.waterLayer.setVisible(true);

		this.grassMap = this.make.tilemap({
			data: this.grassData,
			tileWidth: TILE_WIDTH,
			tileHeight: TILE_WIDTH
		});
		const grassLayer = this.grassMap.createLayer(0, this.tileset, 0, 0);

		this.dirtMap = this.make.tilemap({
			data: this.dirtData,
			tileWidth: TILE_WIDTH,
			tileHeight: TILE_WIDTH
		});
		const dirtLayer = this.dirtMap.createLayer(0, this.tileset, 0, 0);

		this.decorationMap = this.make.tilemap({
			data: this.decorationData,
			tileWidth: TILE_WIDTH,
			tileHeight: TILE_WIDTH
		});
		const decorationLayer = this.decorationMap.createLayer(0, this.tileset, 0, 0);
	}
}