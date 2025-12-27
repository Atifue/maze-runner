const mineflayer = require('mineflayer') // importing mineflayer
const { Vec3 } = require('vec3')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const { GoalBlock } = require('mineflayer-pathfinder').goals

const bot = mineflayer.createBot({
    host: "localhost", // server hosted locally
    port: 25565,    // open to lan and set your own port, likely switch to atternos
    username: 'maze_bot'
    // enter a password field if it's a legit account
})

bot.loadPlugin(pathfinder)

// Data structures for maze solving
const visited = new Set() // Stores visited positions as "x,y,z" strings
const path = [] // Stores the sequence of positions taken
//const TARGET_USERNAME = 'WajTheGoat' //Will teleport to whatever name you enter (Not working, have to do manual tp)

// Helper to convert Vec3 position to a string key
function posToString (pos) {
  return `${pos.x},${pos.y},${pos.z}`
}

function findNearestPlayerEntity () {
  return bot.nearestEntity(e => e.type === 'player' && e !== bot.entity)
}

// Bot action functions
async function moveForward () {
  const direction = new Vec3(
    -Math.sin(bot.entity.yaw),
    0,
    -Math.cos(bot.entity.yaw)
  ).normalize()
  const targetPos = bot.entity.position.offset(direction.x, direction.y, direction.z).floored()
  await bot.pathfinder.goto(new GoalBlock(targetPos.x, targetPos.y, targetPos.z))
  return targetPos
}

async function turnLeft () {
  await bot.look(bot.entity.yaw - Math.PI / 2, bot.entity.pitch, true)
}

async function turnRight () {
  await bot.look(bot.entity.yaw + Math.PI / 2, bot.entity.pitch, true)
}

// Helper functions for checking blocks
function getBotFacingBlock () {
  const direction = new Vec3(
    -Math.sin(bot.entity.yaw),
    0,
    -Math.cos(bot.entity.yaw)
  ).normalize()
  const targetPos = bot.entity.position.offset(direction.x, direction.y, direction.z).floored()
  return bot.world.getBlock(targetPos)
}



function isPathable (block) {
  return block && (block.name === 'air' || block.name.includes('pressure_plate'))
}

// Helper function to create a delay
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let isGenerating = false

function buildMazeGrid (size) {
  const grid = Array.from({ length: size }, () => Array(size).fill(false))
  const stack = [{ x: 1, z: 1 }]
  grid[1][1] = true

  while (stack.length) {
    const current = stack[stack.length - 1]
    const neighbors = []

    const directions = [
      { dx: 2, dz: 0 },
      { dx: -2, dz: 0 },
      { dx: 0, dz: 2 },
      { dx: 0, dz: -2 }
    ]

    for (const dir of directions) {
      const nx = current.x + dir.dx
      const nz = current.z + dir.dz
      if (nx > 0 && nz > 0 && nx < size - 1 && nz < size - 1 && !grid[nx][nz]) {
        neighbors.push({ x: nx, z: nz, wx: current.x + dir.dx / 2, wz: current.z + dir.dz / 2 })
      }
    }

    if (neighbors.length === 0) {
      stack.pop()
      continue
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)]
    grid[next.wx][next.wz] = true
    grid[next.x][next.z] = true
    stack.push({ x: next.x, z: next.z })
  }

  return grid
}

async function generateNewMaze () {
  if (isGenerating) return
  isGenerating = true

  const size = 21 // odd size so walls/corridors alternate
  const wallHeight = 3
  const half = Math.floor(size / 2)
  const min = -half
  const max = half

  console.log('Generating new maze...')

  // 1. Clear the old area and set the floor
  bot.chat(`/fill ~${min} ~-1 ~${min} ~${max} ~-1 ~${max} grass_block`)
  await sleep(100)
  bot.chat(`/fill ~${min} ~ ~${min} ~${max} ~${wallHeight - 1} ~${max} stone`)
  await sleep(100)

  // 2. Carve the maze paths
  const grid = buildMazeGrid(size)
  const openCells = []
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      if (!grid[x][z]) continue
      openCells.push({ x, z })
      const relX = x - half
      const relZ = z - half
      bot.chat(`/fill ~${relX} ~ ~${relZ} ~${relX} ~${wallHeight - 1} ~${relZ} air`)
      await sleep(10)
    }
  }

  // 3. Set the goal at the far corner
  const exitX = size - 2
  const exitZ = size - 2
  bot.chat(`/setblock ~${exitX - half} ~ ~${exitZ - half} stone_pressure_plate`)

  // 4. Move bot to a random open cell
  if (openCells.length > 0) {
    const pick = openCells[Math.floor(Math.random() * openCells.length)]
    bot.chat(`/tp ${bot.username} ~${pick.x - half} ~ ~${pick.z - half}`)
  }

  console.log('Maze ready!')
  isGenerating = false

  startSolving()
}

async function startSolving () {
  // Initialize visited set and path
  visited.clear()
  path.length = 0
  visited.add(posToString(bot.entity.position))
  path.push(bot.entity.position.clone())

  bot.chat('Starting maze exploration!')

  while (true) {
    // Check for exit
    const blockInFront = getBotFacingBlock()
    if (blockInFront && blockInFront.name === 'stone_pressure_plate') {
      bot.chat("Found the maze exit!")
      bot.quit()
    }

    let moved = false

    // 1. Try to move forward
    const forwardBlock = getBotFacingBlock()
    if (isPathable(forwardBlock) && !visited.has(posToString(forwardBlock.position))) {
      const newPos = await moveForward()
      visited.add(posToString(newPos))
      path.push(newPos)
      moved = true
    }

    if (!moved) {
      // 2. Try to turn right and move
      await turnRight()
      const rightBlock = getBotFacingBlock()
      if (isPathable(rightBlock) && !visited.has(posToString(rightBlock.position))) {
        const newPos = await moveForward()
        visited.add(posToString(newPos))
        path.push(newPos)
        moved = true
      }
    }

    if (!moved) {
      // 3. Try to turn left and move (turn left twice to get to left from original forward)
      await turnLeft() // From current orientation (right) to forward
      await turnLeft() // From forward to left
      const leftBlock = getBotFacingBlock()
      if (isPathable(leftBlock) && !visited.has(posToString(leftBlock.position))) {
        const newPos = await moveForward()
        visited.add(posToString(newPos))
        path.push(newPos)
        moved = true
      }
    }

    if (!moved) {
      // If no new path found, backtrack
      if (path.length > 1) {
        bot.chat('Backtracking...')
        path.pop() // Remove current position from path
        const prevPos = path[path.length - 1]
        await bot.pathfinder.goto(new GoalBlock(prevPos.x, prevPos.y, prevPos.z))
        // Ensure bot is looking in the direction of the previous position to continue exploration
        await bot.lookAt(prevPos.offset(0.5, 1, 0.5), true) // Look towards the center of the previous block
      } else {
        bot.chat('No solution found or bot is stuck. Regenerating...')
        await generateNewMaze()
        return
      }
    }

    await bot.waitForTicks(10) // Small delay to prevent busy-looping
  }
}

bot.once('spawn', () => {
  // const tick = setInterval(() => {
  //   const player = bot.players[TARGET_USERNAME]?.entity //Go to player listed
  //   if (!player) return

  //   clearInterval(tick)
    //const playerPos = player.position.clone()
    //bot.chat(`/tp ${bot.username} ${playerPos.x} ${playerPos.y} ${playerPos.z}`)

    // start moving shortly after teleport
    const tick = setInterval(() => {
    const player = findNearestPlayerEntity()
    if (!player) return
    clearInterval(tick)
    bot.chat(`/tp ${bot.username} ${player.username}`)
    
    setTimeout(() => {
      generateNewMaze()
    }, 1000)
  }, 500)
})



