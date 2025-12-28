const mineflayer = require('mineflayer') // importing mineflayer
const { Vec3 } = require('vec3')
const pathfinder = require('mineflayer-pathfinder').pathfinder
const { GoalBlock } = require('mineflayer-pathfinder').goals
const { posToString, isPathable, isExitBlock, generateNewMaze } = require('./maze')

function getArgValue (flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] || null
}

const host = process.env.MAZE_BOT_HOST || getArgValue('--host') || 'localhost'
const portInput = process.env.MAZE_BOT_PORT || getArgValue('--port') || '25565'
const port = Number.parseInt(portInput, 10)
const username = process.env.MAZE_BOT_USERNAME || getArgValue('--username') || 'maze_bot'

if (!Number.isFinite(port)) {
  throw new Error(`Invalid port: ${portInput}`)
}

const bot = mineflayer.createBot({
  host, // server hosted locally by default
  port, // open to lan and set your own port, likely switch to atternos
  username
  // enter a password field if it's a legit account
})

bot.loadPlugin(pathfinder)

// Data structures for maze solving
const visited = new Set() // Stores visited positions as "x,y,z" strings
const path = [] // Stores the sequence of positions taken
//const TARGET_USERNAME = 'WajTheGoat' //Will teleport to whatever name you enter (Not working, have to do manual tp)

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

function getBlockUnderfoot () {
  const footPos = bot.entity.position.floored()
  return bot.blockAt(footPos.offset(0, -1, 0))
}

function generateMaze () {
  return generateNewMaze({ bot, startSolving })
}

async function startSolving () {
  // Initialize visited set and path
  visited.clear()
  path.length = 0
  const startPos = bot.entity.position.floored()
  visited.add(posToString(startPos))
  path.push(startPos.clone())

  bot.chat('Starting maze exploration!')

  while (true) {
    // Check for exit (underfoot or in front)
    const blockInFront = getBotFacingBlock()
    const blockUnderfoot = getBlockUnderfoot()
    if (isExitBlock(blockUnderfoot) || isExitBlock(blockInFront)) {
      bot.chat("Found the maze exit!")
      bot.quit()
      return
    }

    let moved = false

    // 1. Try to move forward
    const forwardBlock = blockInFront
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
        await generateMaze()
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
      generateMaze()
    }, 1000)
  }, 500)
})
