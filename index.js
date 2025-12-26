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
const TARGET_USERNAME = 'WajTheGoat' //Will teleport to whatever name you enter (Not working, have to do manual tp)

// Helper to convert Vec3 position to a string key
function posToString (pos) {
  return `${pos.x},${pos.y},${pos.z}`
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

bot.once('spawn', () => {
  // Initialize visited set and path
  visited.clear()
  path.length = 0
  visited.add(posToString(bot.entity.position))
  path.push(bot.entity.position.clone())
  
  const tick = setInterval(() => {
    const player = bot.players[TARGET_USERNAME]?.entity //Go to player listed
    if (!player) return

    clearInterval(tick)
    const playerPos = player.position.clone()
    bot.chat(`/tp ${bot.username} ${playerPos.x} ${playerPos.y} ${playerPos.z}`)

    // start moving shortly after teleport
    setTimeout(async () => {
      bot.chat('Starting maze exploration!')

      while (true) {
        // Check for exit
        const blockInFront = getBotFacingBlock()
        if (blockInFront && blockInFront.name === 'pressure_plate') {
          bot.chat('Found the maze exit!')
          bot.end()
          return
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
            bot.chat('No solution found or bot is stuck in a loop at start.')
            bot.end()
            return
          }
        }

        await bot.waitForTicks(10) // Small delay to prevent busy-looping
      }
    }, 1000)
  }, 500)
})



