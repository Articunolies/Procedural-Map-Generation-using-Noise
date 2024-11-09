class mapgeneration extends Phaser.Scene
{
	// Noise Parameters:
	xOffset = 0;				// less = left, more = right
	yOffset = 0;				// less = down, more = up
	frequency = 0.105;			// less = less diversity/zoom in, more = more diversity/zoom out
	fbmEnabled = true;			// "Fractional Brownian Motion"
	numOctaves = 4;				// less = simpler, more = more complicated
	textureEnabled = false;		// refers to the perlin noise texture behind the tile-based map
	rtf = 1;					// "range transformation formula"; 1 = (n+1)/2, 2 = |n|

	// Control Parameters:
	largeOffsetChange = 5;
	smallOffsetChange = 1;
	largeFrequencyChange = 0.1;
	smallFrequencyChange = 0.01;

	// Map Constants:
	waterWeight = 2;
	grassWeight = 1;
	dirtWeight = 1;

	// Methods:
	constructor() {
		super("proceduralMapGenerationScene");
	}

	preload()
	{
		this.load.path = './assets/';
		this.load.image("map pack", "mapPack_spritesheet.png");
	}

	create()
	{
		this.initializeVariables();
		this.initializeControls();
		noise.seed(Math.random());
		this.generate();
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
		this.startingFBMEnabled = this.fbmEnabled;
		this.startingNumOctaves = this.numOctaves;
		this.startingTextureEnabled = this.textureEnabled;
		this.startingRTF = this.rtf;

		// Initialize input keys
		this.moveUpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
		this.moveDownKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
		this.moveLeftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
		this.moveRightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
		this.increaseFrequencyKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PERIOD);
		this.decreaseFrequencyKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.COMMA);
		this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
		this.toggleFBMKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
		this.increaseOctavesKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
		this.decreaseOctavesKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
		this.toggleTextureKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
		this.switchRTFKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
		this.resetChangesKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
		this.randomizeSeedKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

		// Display controls
		const controls = `
		<h2>Controls (open console recommended)</h2>
		Move: WASD | SHIFT + WASD <br>
		Zoom (change frequency): COMMA/PERIOD | SHIFT + COMMA/PERIOD <br>
		<br>
		Toggle FBM: F <br>
		Change Octaves: Q/E <br>
		<br>
		Toggle Texture: T <br>
		Switch Range Transformation Formula: G <br>
		<br>
		Reset Changes: C <br>
		Randomize Seed: R
		`;
		document.getElementById("description").innerHTML = controls;

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
		this.increaseFrequencyKey.on("down", (key, event) => {			// increase frequency

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
		this.decreaseFrequencyKey.on("down", (key, event) => {			// decrease frequency

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
		this.toggleFBMKey.on("down", (key, event) => {					// toggle FBM
			this.fbmEnabled = !this.fbmEnabled;
			this.generate();
			if (this.fbmEnabled) {
				console.log("FBM enabled");
			}
			else {
				console.log("FBM disabled");
			}
		});
		this.increaseOctavesKey.on("down", (key, event) => {			// increase octaves
			this.numOctaves++;
			this.generate();
			console.log(`octaves = ${this.numOctaves}`);
		});
		this.decreaseOctavesKey.on("down", (key, event) => {			// decrease octaves
			this.numOctaves--;
			this.generate();
			console.log(`octaves = ${this.numOctaves}`);
		});
		this.toggleTextureKey.on("down", (key, event) => {				// toggle texture
			this.textureEnabled = !this.textureEnabled;
			this.generate();
			if (this.textureEnabled) {
				console.log("showing texture");
			}
			else {
				console.log("showing map");
			}
		});
		this.switchRTFKey.on("down", (key, event) => {					// switch RTF
			if (this.rtf == 1) {
				this.rtf = 2;
				console.log("transforming [-1, 1] to [0, 1] via n = |n|")
			}
			else {
				this.rtf = 1;
				console.log("transforming [-1, 1] to [0, 1] via n = (n-1)/2")
			}
			this.generate();
		});
		this.resetChangesKey.on("down", (key, event) => {				// reset changes
			this.xOffset = this.startingXOffset;
			this.yOffset = this.startingYOffset;
			this.frequency = this.startingFrequency;
			this.fbmEnabled = this.startingFBMEnabled;
			this.numOctaves = this.startingNumOctaves;
			this.rtf = this.startingRTF;
			this.textureEnabled = this.startingTextureEnabled;
			this.generate();
			console.log("reset changes");
		});
		this.randomizeSeedKey.on("down", (key, event) => {				// randomize seed
			noise.seed(Math.random());
			this.generate();
			console.log("changed seed");
		});
	}

	generate()
	{
		this.generatePerlinData();
		this.destroyMapAndTexture();
		if (this.textureEnabled) {
			this.generateTexture();
		}
		else {
			this.generateMapData();
			this.generateGrassData();
			this.generateDirtData();
			this.createMaps();
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
		if (this.rtf == 1) {				// function from the perlin noise article
			return (value + 1) / 2;
		}
		else {
			return Math.abs(value);			// function used in the perlin noise library example
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
		// Use the perlin data to set the tile type
		for (let y = 0; y < MAP_WIDTH; y++) {
			for (let x = 0; x < MAP_WIDTH; x++) {

				const value = this.perlinData[y][x];
				if (value < this.waterWeight/this.totalWeight) {								// water
					this.mapData[y][x] = WATER_TID;
				}
				else if (value < (this.waterWeight+this.grassWeight)/this.totalWeight) {		// grass
					this.mapData[y][x] = GRASS_TID;
				}
				else {																			// dirt
					this.mapData[y][x] = DIRT_TID;
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
	createMaps()
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
	}
}