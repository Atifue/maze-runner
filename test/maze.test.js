const test = require('node:test')
const assert = require('node:assert/strict')
const { buildMazeGrid, posToString, isPathable, isExitBlock, generateNewMaze } = require('../maze')

test('posToString floors positions to block coordinates', () => {
  const key = posToString({ x: 1.9, y: 64.1, z: -3.2 })
  assert.equal(key, '1,64,-4')
})

test('isPathable allows air and pressure plates only', () => {
  assert.equal(isPathable({ name: 'air' }), true)
  assert.equal(isPathable({ name: 'stone_pressure_plate' }), true)
  assert.equal(isPathable({ name: 'stone' }), false)
  assert.equal(isPathable(null), false)
})

test('isExitBlock detects any pressure plate', () => {
  assert.equal(isExitBlock({ name: 'stone_pressure_plate' }), true)
  assert.equal(isExitBlock({ name: 'light_weighted_pressure_plate' }), true)
  assert.equal(isExitBlock({ name: 'stone' }), false)
})

test('buildMazeGrid returns a square grid with open start and closed borders', () => {
  const size = 11
  const grid = buildMazeGrid(size)

  assert.equal(grid.length, size)
  for (const row of grid) {
    assert.equal(row.length, size)
  }

  assert.equal(grid[1][1], true)

  let openCount = 0
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      if (grid[x][z]) openCount += 1
      if (x === 0 || z === 0 || x === size - 1 || z === size - 1) {
        assert.equal(grid[x][z], false)
      }
    }
  }

  assert.ok(openCount > 1)
})

test('generateNewMaze issues expected commands and invokes startSolving', async () => {
  const chats = []
  const bot = {
    username: 'maze_bot',
    chat: (message) => chats.push(message)
  }
  let started = false

  await generateNewMaze({
    bot,
    startSolving: () => {
      started = true
    },
    size: 5,
    wallHeight: 3
  })

  assert.ok(chats.includes('/fill ~-2 ~-1 ~-2 ~2 ~-1 ~2 grass_block'))
  assert.ok(chats.includes('/fill ~-2 ~ ~-2 ~2 ~2 ~2 stone'))
  assert.ok(chats.includes('/setblock ~1 ~ ~1 stone_pressure_plate'))
  assert.ok(chats.some((message) => message.startsWith(`/tp ${bot.username} `)))
  assert.equal(started, true)
})
