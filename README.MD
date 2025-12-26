# Minecraft Maze Bot

## Project Overview

This project is a Minecraft bot written in JavaScript using the `mineflayer` library. Its primary goal is to navigate a maze within a Minecraft world and find the exit through trial and error. The current implementation includes basic movement, a mechanism to detect and avoid getting stuck, and a condition to identify the end of the maze.

## Technologies Used

*   **Node.js:** The JavaScript runtime environment.
*   **mineflayer:** A powerful, high-level API for interacting with the Minecraft protocol, enabling the creation of Minecraft bots.

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
node index.js
```

### Minecraft Server Setup

For the bot to function correctly, you need a running Minecraft server:

1.  **Create a Minecraft World:** Start a single-player Minecraft world.
2.  **Open to LAN:** Open the world to LAN from the in-game pause menu. Note down the port number that Minecraft provides (e.g., `25565`).
3.  **Adjust Bot Configuration:** If your LAN server's port is different from `25565`, you will need to update the `port` in the `mineflayer.createBot` configuration within `index.js`.
4.  **Player Presence:** Ensure there is at least one player in the Minecraft world. The bot is configured to teleport to the nearest player upon spawning, which helps in positioning the bot for maze navigation.

## Current Bot Behavior

Upon connecting and spawning:
*   The bot will attempt to teleport to the nearest player's location.
*   After a brief delay, it will start exploring the maze.
*   The bot considers the maze "finished" if it steps on a `gold_pressure_plate`. Upon detection, it will send a chat message "Found the maze exit!" and disconnect from the server.