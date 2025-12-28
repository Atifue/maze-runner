# Minecraft Maze Bot

## Project Overview

This project is a Minecraft bot written in JavaScript using the `mineflayer` library. Its primary goal is to navigate a maze within a Minecraft world and find the exit through trial and error. The current implementation includes basic movement, a mechanism to detect and avoid getting stuck, and a condition to identify the end of the maze.

## Technologies Used

*   **Node.js:** The JavaScript runtime environment.
*   **mineflayer:** A powerful, high-level API for interacting with the Minecraft protocol, enabling the creation of Minecraft bots.

## Requirements

*   Node.js 18+ (for the built-in test runner).
*   A Minecraft Java server or LAN world with cheats enabled.

## Building and Running

### Installation

To set up the project, navigate to the project root directory in your terminal and run:

```bash
npm install
```

This command will install the `mineflayer` dependency specified in `package.json`.

### Running the Bot

To start the Minecraft bot, execute the following command in the project root:

```bash
node runner.js
```

### Configuration

Edit the `mineflayer.createBot` options in `runner.js` to match your server:

*   `host`: Server host (default `localhost`).
*   `port`: Server port (default `25565`).
*   `username`: Bot username.

You can also configure the bot via environment variables or CLI flags:

```bash
# Environment variables
MAZE_BOT_HOST=localhost MAZE_BOT_PORT=25565 MAZE_BOT_USERNAME=maze_bot node runner.js

# CLI flags
node runner.js --host localhost --port 25565 --username maze_bot
```

### Minecraft Server Setup

For the bot to function correctly, you need a running Minecraft server:

1.  **Create a Minecraft World:** Start a single-player Minecraft world.
2.  **Open to LAN:** Open the world to LAN from the in-game pause menu. Note down the port number that Minecraft provides (e.g., `25565`).
3.  **Adjust Bot Configuration:** If your LAN server's port is different from `25565`, you will need to update the `port` in the `mineflayer.createBot` configuration within `runner.js`.
4.  **Player Presence:** Ensure there is at least one player in the Minecraft world. The bot is configured to teleport to the nearest player upon spawning, which helps in positioning the bot for maze navigation.

### Permissions

Maze generation uses commands like `/fill`, `/setblock`, and `/tp`, so the bot account must have permission to run commands (LAN world with cheats enabled or an operator account on a server).

## Current Bot Behavior

Upon connecting and spawning:
*   The bot will attempt to teleport to the nearest player's location.
*   After a brief delay, it will start exploring the maze.
*   The bot considers the maze "finished" when it steps on any pressure plate. Upon detection, it will send a chat message "Found the maze exit!" and disconnect from the server.

## Testing

Run the unit tests with:

```bash
npm test
```

## TODO

*   Consider migrating JavaScript to TypeScript for stronger type safety.
*   Add integration tests that spin up a Minecraft server and exercise the bot end-to-end.
*   Add a lightweight backend service (e.g., Express/Fastify) to trigger maze generation, restart the bot, and tweak maze parameters via an API; also collect and store logs from bot events (chat messages, maze exit found, errors) for later analysis or a simple dashboard.
*   Add support for deterministic maze seeds so runs can be reproduced and debugged.
*   Add configurable maze parameters (size, wall height, exit block) via env/CLI flags.
*   Add structured logging output (JSON) with timestamps and event types for easier parsing.


* Move to bun in future instead of npm ? 

*ADD ci cd ? 