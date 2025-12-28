function posToString (pos) {
  const x = Math.floor(pos.x)
  const y = Math.floor(pos.y)
  const z = Math.floor(pos.z)
  return `${x},${y},${z}`
}

function isPathable (block) {
  return !!(block && block.name && (block.name === 'air' || block.name.includes('pressure_plate')))
}

function isExitBlock (block) {
  return !!(block && block.name && block.name.includes('pressure_plate'))
}

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

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let isGenerating = false

async function generateNewMaze ({ bot, startSolving, size = 21, wallHeight = 3 } = {}) {
  if (!bot) {
    throw new Error('generateNewMaze requires a bot instance')
  }
  if (isGenerating) return
  isGenerating = true

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

  if (typeof startSolving === 'function') {
    startSolving()
  }
}

module.exports = {
  posToString,
  isPathable,
  isExitBlock,
  buildMazeGrid,
  generateNewMaze
}
