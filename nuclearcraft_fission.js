'use strict';
const BLOCKS = {
	EMPTY: 0,
	CELL: 1,
	MODERATOR: 2,
	WATER: 3,
	REDSTONE: 4,
	QUARTZ: 5,
	GOLD: 6,
	GLOWSTONE: 7,
	LAPIS: 8,
	DIAMOND: 9,
	HELIUM: 10,
	ENDERIUM: 11,
	CRYOTHEUM: 12,
	IRON: 13,
	EMERALD: 14,
	COPPER: 15,
	TIN: 16,
	MAGNESIUM: 17,
}
function cellEfficiency (grid, x, y, z) {
	let adjacent = 0;
	function scan (axis, direction, condition_function, grid_lookup_function) {
		for (let i = axis + direction; condition_function(i); i += direction) {
			if (grid_lookup_function(i) == BLOCKS.CELL) {
				return 1;
			} else if (grid_lookup_function(i) != BLOCKS.MODERATOR) {
				return 0;
			}
		}
		return 0;
	}
	adjacent += scan(x, -1, i => (i >= 0) && (x - i <= 4), i => grid[i][y][z]);
	adjacent += scan(
		x, 1, i => (i < grid.length) && (i - x <= 4), i => grid[i][y][z]
	);
	adjacent += scan(y, -1, i => (i >= 0) && (y - i <= 4), i => grid[x][i][z]);
	adjacent += scan(
		y, 1, i => (i < grid[x].length) && (i - y <= 4), i => grid[x][i][z]
	);
	adjacent += scan(z, -1, i => (i >= 0) && (z - i <= 4), i => grid[x][y][i]);
	adjacent += scan(
		z, 1, i => (i < grid[x][y].length) && (i - z <= 4),i => grid[x][y][i])
	;
	return adjacent + 1;
}
function isAdjacentToAtLeastN(grid, x, y, z, n, condition) {
	let count = 0;
	if ((x > 0) && condition(grid, x - 1, y, z)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	if ((x < grid.length - 1) && condition(grid, x + 1, y, z)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	if ((y > 0) && condition(grid, x, y - 1, z)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	if ((y < grid[x].length - 1) && condition(grid, x, y + 1, z)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	if ((z > 0) && condition(grid, x, y, z - 1)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	if ((z < grid[x].length - 1) && condition(grid, x, y, z + 1)) {
		count += 1;
		if (count >= n) {
			return true;
		}
	}
	return (count >= n);
}
function isAdjacentToAtLeastOneReactorCasing(grid, x, y, z) {
	return
		(x == 0) || (x == grid.length - 1) ||
		(y == 0) || (y == grid[x].length - 1) ||
		(z == 0) || (z == grid[x][y].length - 1);
}
function generateIsValidBlock (type) {
	return (grid, x, y, z) => (
		(grid[x][y][z] == type) && BLOCK_PROPERTIES[type].valid(grid, x, y, z)
	);
}
let isCell = (grid, x, y, z) => (grid[x][y][z] == BLOCKS.CELL);
function isActiveModerator(grid, x, y, z) {
	// Should this also cover when a moderator is used to extend cell adjacency?
	return
		(grid[x][y][z] == BLOCKS.MODERATOR) &&
		isAdjacentToAtLeastN(grid, x, y, z, 1, isCell);
};
let isValidGlowstoneCooler = generateIsValidBlock(BLOCKS.GLOWSTONE);
let isValidGoldCooler = generateIsValidBlock(BLOCKS.GOLD);
let isValidLapisCooler = generateIsValidBlock(BLOCKS.LAPIS);
let isValidQuartzCooler = generateIsValidBlock(BLOCKS.QUARTZ);
let isValidRedstoneCooler = generateIsValidBlock(BLOCKS.REDSTONE);
let isValidWaterCooler = generateIsValidBlock(BLOCKS.WATER);
let BLOCK_PROPERTIES = {
	[BLOCKS.EMPTY]: {
		'display': 'Empty',
		'cool': 0,
		'valid': () => true,
	},
	[BLOCKS.CELL]: {
		'display': 'Cell',
		'cool': 0,
		'heat': function (fuel, grid, x, y, z) {
			let e = cellEfficiency(grid, x, y, z);
			return fuel.heat * e * (e + 1) / 2;
		},
		'power': function (fuel, grid, x, y, z) {
			return fuel.power * cellEfficiency(grid, x, y, z);
		},
		'valid': () => true,
	},
	[BLOCKS.MODERATOR]: {
		'display': 'Moderator',
		'cool': 0,
		'heat': function (fuel, grid, x, y, z) {
			let sum = 0;
			if ((x > 0) && (grid[x - 1][y][z] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x - 1, y, z) / 3;
			}
			if ((x < grid.length - 1) && (grid[x + 1][y][z] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x + 1, y, z) / 3;
			}
			if ((y > 0) && (grid[x][y - 1][z] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x, y - 1, z) / 3;
			}
			if ((y < grid[x].length - 1) && (grid[x][y + 1][z] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x, y + 1, z) / 3;
			}
			if ((z > 0) && (grid[x][y][z - 1] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x, y, z - 1) / 3;
			}
			if ((z < grid[x][y].length - 1) && (grid[x][y][z + 1] == BLOCKS.CELL)) {
				sum += fuel.heat * cellEfficiency(grid, x, y, z + 1) / 3;
			}
			if (sum == 0) {
				return fuel.heat;
			}
			return sum;
		},
		'power': function (fuel, grid, x, y, z) {
			let sum = 0;
			if ((x > 0) && (grid[x - 1][y][z] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x - 1, y, z) / 6;
			}
			if ((x < grid.length - 1) && (grid[x + 1][y][z] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x + 1, y, z) / 6;
			}
			if ((y > 0) && (grid[x][y - 1][z] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x, y - 1, z) / 6;
			}
			if ((y < grid[x].length - 1) && (grid[x][y + 1][z] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x, y + 1, z) / 6;
			}
			if ((z > 0) && (grid[x][y][z - 1] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x, y, z - 1) / 6;
			}
			if ((z < grid[x][y].length - 1) && (grid[x][y][z + 1] == BLOCKS.CELL)) {
				sum += fuel.power * cellEfficiency(grid, x, y, z + 1) / 6;
			}
			return sum;
		},
		// An inactive moderator can still be useful up to 4 blocks away from a
		// cell, so let moderators be "valid" anywhere.
		'valid': () => true,
	},
	[BLOCKS.WATER]: {
		'display': 'Water',
		'cool': 20,
		'valid': function (grid, x, y, z) {
			function isCellOrActiveModerator (grid, x, y, z) {
				return
					isCell(grid, x, y, z) || isActiveModerator(grid, x, y, z);
			}
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isCellOrActiveModerator);
		},
	},
	[BLOCKS.REDSTONE]: {
		'display': 'Redstone',
		'cool': 80,
		'valid': function (grid, x, y, z) {
			return isAdjacentToAtLeastN(grid, x, y, z, 1, isCell);
		},
	},
	[BLOCKS.QUARTZ]: {
		'display': 'Quartz',
		'cool': 80,
		'valid': function (grid, x, y, z) {
			return isAdjacentToAtLeastN(grid, x, y, z, 1, isActiveModerator);
		},
	},
	[BLOCKS.GOLD]: {
		'display': 'Gold',
		'cool': 120,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidWaterCooler) &&
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidRedstoneCooler);
		},
	},
	[BLOCKS.GLOWSTONE]: {
		'display': 'Glowstone',
		'cool': 120,
		'valid': function (grid, x, y, z) {
			return isAdjacentToAtLeastN(grid, x, y, z, 2, isActiveModerator);
		},
	},
	[BLOCKS.LAPIS]: {
		'display': 'Lapis',
		'cool': 100,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isCell) &&
				isAdjacentToAtLeastOneReactorCasing(grid, x, y, z);
		},
	},
	[BLOCKS.DIAMOND]: {
		'display': 'Diamond',
		'cool': 120,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidWaterCooler) &&
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidQuartzCooler);
		},
	},
	[BLOCKS.HELIUM]: {
		'display': 'Liquid Helium',
		'cool': 120,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidRedstoneCooler) &&
				isAdjacentToAtLeastOneReactorCasing(grid, x, y, z);
		},
	},
	[BLOCKS.ENDERIUM]: {
		'display': 'Enderium',
		'cool': 140,
		'valid': function (grid, x, y, z) {
			return
				((x == 0) || (x == grid.length - 1)) &&
				((y == 0) || (y == grid[x].length - 1)) &&
				((z == 0) || (z == grid[x][y].length - 1));
		},
	},
	[BLOCKS.CRYOTHEUM]: {
		'display': 'Cryotheum',
		'cool': 140,
		'valid': function (grid, x, y, z) {
			return isAdjacentToAtLeastN(grid, x, y, z, 2, isCell);
		},
	},
	[BLOCKS.IRON]: {
		'display': 'Iron',
		'cool': 60,
		'valid': function (grid, x, y, z) {
			return isAdjacentToAtLeastN(grid, x, y, z, 1, isValidGoldCooler);
		},
	},
	[BLOCKS.EMERALD]: {
		'display': 'Emerald',
		'cool': 140,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isActiveModerator) &&
				isAdjacentToAtLeastN(grid, x, y, z, 1, isCell);
		},
	},
	[BLOCKS.COPPER]: {
		'display': 'Copper',
		'cool': 60,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastN(grid, x, y, z, 1, isValidGlowstoneCooler);
		},
	},
	[BLOCKS.TIN]: {
		'display': 'Tin',
		'cool': 80,
		'valid': function (grid, x, y, z) {
			return (
				(x > 0) &&
				isValidLapisCooler(grid, x - 1, y, z) &&
				(x < grid.length - 1) &&
				isValidLapisCooler(grid, x + 1, y, z)
			) || (
				(y > 0) &&
				isValidLapisCooler(grid, x, y - 1, z) &&
				(y < grid[x].length - 1) &&
				isValidLapisCooler(grid, x, y + 1, z)
			) || (
				(z > 0) &&
				isValidLapisCooler(grid, x, y, z - 1) &&
				(z < grid[x][y].length - 1) &&
				isValidLapisCooler(grid, x, y, z + 1)
			);
		},
	},
	[BLOCKS.MAGNESIUM]: {
		'display': 'Magnesium',
		'cool': 100,
		'valid': function (grid, x, y, z) {
			return
				isAdjacentToAtLeastOneReactorCasing(grid, x, y, z) &&
				isAdjacentToAtLeastN(grid, x, y, z, 1, isActiveModerator);
		},
	},
};
function calculatePower (fuel, grid) {
	let sum = 0;
	for (let x = 0; x < grid.length; ++x) {
		for (let y = 0; y < grid[x].length; ++y) {
			for (let z = 0; z < grid[x][y].length; ++z) {
				let block = grid[x][y][z];
				if (BLOCK_PROPERTIES[block].hasOwnProperty('power')) {
					sum += BLOCK_PROPERTIES[block].power(fuel, grid, x, y, z);
				}
			}
		}
	}
	return sum;
}
function calculateHeat (fuel, grid) {
	let sum = 0;
	for (let x = 0; x < grid.length; ++x) {
		for (let y = 0; y < grid[x].length; ++y) {
			for (let z = 0; z < grid[x][y].length; ++z) {
				let block = grid[x][y][z];
				if (BLOCK_PROPERTIES[block].hasOwnProperty('heat')) {
					sum += BLOCK_PROPERTIES[block].heat(fuel, grid, x, y, z);
				}
				sum -= BLOCK_PROPERTIES[block].cool;
			}
		}
	}
	return sum;
}
function gridCopy (grid) {
	let ret = [];
	for (let x = 0; x < grid.length; ++x) {
		ret[x] = [];
		for (let y = 0; y < grid[x].length; ++y) {
			ret[x][y] = [];
			for (let z = 0; z < grid[x][y].length; ++z) {
				ret[x][y][z] = grid[x][y][z];
			}
		}
	}
	return ret;
}
function gridToString (grid) {
	let ret = '[';
	for (let x = 0; x < grid.length; ++x) {
		ret += '[';
		for (let y = 0; y < grid[x].length; ++y) {
			ret += '[';
			for (let z = 0; z < grid[x][y].length; ++z) {
				if (typeof grid[x][y][z] == 'string') {
					ret += '"' + grid[x][y][z] + '",';
				} else {
					ret += grid[x][y][z] + ',';
				}
			}
			ret += '],';
		}
		ret += ']';
	}
	return ret + ']';		
}
let bestPower = 0;
let bestHeat = 0;
let bestGrid = 'not started';
function gridStep (fuel, grid, x, y, z) {
	if (z >= grid[x][y].length) {
		y += 1;
		z = 0;
	}
	if (y >= grid[x].length) {
		x += 1;
		y = 0;
	}
	if (x >= grid.length) {
		let thisPower = calculatePower(fuel, grid);
		let thisHeat = calculateHeat(fuel, grid);
		// If we produce as much power as the previous best, prefer the
		// grid that produces more heat (but still not positive) since
		// that grid probably uses more efficient materials to do that.
		if ((thisHeat <= 0) && ((thisPower > bestPower) || ((thisPower == bestPower) && (thisHeat > bestHeat)))) {
			bestPower = thisPower;
			bestHeat = thisHeat;
			bestGrid = gridToString(grid);
			console.log('New best power', bestPower, 'and heat', bestHeat, 'with grid', bestGrid);
		}
		return;
	}
	for (let blockName in BLOCKS) {
		if (!BLOCKS.hasOwnProperty(blockName)) {
			continue;
		}
		grid[x][y][z] = BLOCKS[blockName];
		// Once we assign this block, the block at (x - 1) has all 6
		// adjacent blocks assigned and can be checked for validity to
		// cut off some recursion.
		if ((x > 0) && !BLOCK_PROPERTIES[grid[x - 1][y][z]].valid(grid, x - 1, y, z)) {
			continue;
		}
		// If we're at the end of (x), we can also check (y - 1) since
		// all blocks adjacent to (y - 1) are filled too ((x + 1) will
		// be reactor casing)
		if (x == grid.length - 1) {
			if ((y > 0) && !BLOCK_PROPERTIES[grid[x][y - 1][z]].valid(grid, x, y - 1, z)) {
				continue;
			}
			if (y == grid[x].length - 1) {
				if ((z > 0) && !BLOCK_PROPERTIES[grid[x][y][z - 1]].valid(grid, x, y, z - 1)) {
					continue;
				}
				if ((z == grid[x][y].length - 1) && !BLOCK_PROPERTIES[grid[x][y][z]].valid(grid, x, y, z)) {
					continue;
				}
			}
		}
		gridStep(fuel, grid, x, y, z + 1);
	}
}
onmessage = function (message) {
	let fuel = message.data.fuel;
	// let grid = [
	// 	[
	// 		[1, 2, 1],
	// 		[8, 16, 8],
	// 		[1, 8, 1],
	// 	],
	// 	[
	// 		[2, 7, 2],
	// 		[7, 15, 7],
	// 		[2, 7, 2],
	// 	],
	// 	[
	// 		[1, 8, 1],
	// 		[2, 7, 2],
	// 		[1, 8, 1],
	// 	],
	// ];
	// console.log('Power', calculatePower(fuel, grid));  // Should be ~10K
	// console.log('Heat', calculateHeat(fuel, grid));
	let grid = [];
	for (let x = 0; x < message.data.size; ++x) {
		grid[x] = [];
		for (let y = 0; y < message.data.size; ++y) {
			grid[x][y] = [];
			for (let z = 0; z < message.data.size; ++z) {
				grid[x][y][z] = BLOCKS.EMPTY;
			}
		}
	}
	console.log('Got fuel', fuel, '; creating grid', gridToString(grid));
	gridStep(fuel, grid, 0, 0, 0);
	postMessage({'power': bestPower, 'heat': bestHeat, 'grid': bestGrid});
}
