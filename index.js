const mineflayer = require('mineflayer') // importing mineflayer

const bot = mineflayer.createBot({
    host: "localhost", // server hosted locally
    port: 25565,    // open to lan and set your own port, likely switch to atternos
    username: 'maze_bot'
    // enter a password field if it's a legit account
})

function findNearestPlayerEntity () {
  return bot.nearestEntity(e => e.type === 'player' && e !== bot.entity)
}

bot.once('spawn', () => {
  const tick = setInterval(() => {
    const player = findNearestPlayerEntity()
    if (!player) return

    clearInterval(tick)
    bot.chat(`/tp ${bot.username} ${player.username}`)

    // start moving shortly after teleport
    setTimeout(() => {
      bot.setControlState("forward", true)

      let lastPos = bot.entity.position.clone()
      let lastMoveTime = Date.now()
      let turnLeftNext = true

      const moveCheck = setInterval(() => {
        const pos = bot.entity.position
        const moved = pos.distanceTo(lastPos)

        if (moved > 0.2) {
          lastPos = pos.clone()
          lastMoveTime = Date.now()
          return
        }

        if (Date.now() - lastMoveTime > 1500) {
          // stuck: stop, turn and alternate directions to avoid backtracking
          bot.setControlState("forward", false)
          const turnYaw = turnLeftNext ? Math.PI / 2 : -Math.PI / 2
          bot.look(bot.entity.yaw + turnYaw, bot.entity.pitch, true)
          turnLeftNext = !turnLeftNext
          bot.setControlState("forward", true)
          lastPos = bot.entity.position.clone()
          lastMoveTime = Date.now()
          if(bot.blockAtCursor(maxDistance=1) && bot.blockAtCursor(maxDistance=1).name == 'stripped_jungle_log'){
            bot.chat('end')
            bot.end()
            return
          }
        }
      }, 250)

      bot.on('end', () => clearInterval(moveCheck))
    }, 1000)
  }, 500)
})



