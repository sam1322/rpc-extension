const DiscordRPC = require("discord-rpc");
const express = require("express");
const bodyParser = require("body-parser");
const { validateTimeStamp, validateText } = require("./validations");

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const clientId = process.env.DISCORD_CLIENT_ID; // Replace with your actual client ID
const rpc = new DiscordRPC.Client({ transport: "ipc" });

// Function to update Rich Presence
function updatePresence(activityState) {
  rpc.setActivity(activityState);
}

// Function to handle graceful shutdown
async function handleExit() {
  console.log("Clearing Rich Presence and shutting down...");
  try {
    await rpc.clearActivity();
    console.log("Rich Presence cleared");
    rpc.destroy();
    console.log("RPC connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

async function clearStatus() {
  console.log("Clearing Rich Presence and shutting down...");
  try {
    await rpc.clearActivity();
    console.log("Rich Presence cleared");
  } catch (error) {
    console.error("Error during clearing status:", error);
  }
}

rpc.on("ready", () => {
  console.log("RPC is running");

  // // Set initial presence
});

rpc.login({ clientId }).catch(console.error);

// POST endpoint
app.post("/update", (req, res) => {
  const {
    state,
    details,
    largeImageKey,
    largeImageText,

    title,
    thumbnail,
    channelName,
    channelUrl,
    url,
    isPlaying,
    smallImageKey,
    smallImageText,
    buttonLabel,
    buttonUrl,

    startTimestamp,
    endTimestamp
  } = req.body;

  const detailsData = title ?? details
  const stateData = state ?? channelName
  const largeImageKeyData = thumbnail ?? largeImageKey
  const largeImageTextData = title ?? largeImageText

  const activityState = {
    smallImageKey: isPlaying ? "https://res.cloudinary.com/dw5xqmxyu/image/upload/v1721882387/play4_kppcqd.png" : "https://res.cloudinary.com/dw5xqmxyu/image/upload/v1721882388/pause3_ashttx.png",
    smallImageText: isPlaying ? "Playing" : "Paused",
  };
  if (url != "" && url != null && channelUrl != "" && channelUrl != null) {
    activityState.buttons = [
      {
        label: buttonLabel ?? "Watch Along",
        url: url ?? "https://discord.com",
      },
      {
        label: "Follow Channel",
        url: channelUrl ?? "https://discord.com",
      },
    ];
  }

  if (validateTimeStamp(endTimestamp)) {
    activityState.endTimestamp = endTimestamp;
  }

  if (validateTimeStamp(startTimestamp)) {
    activityState.startTimestamp = startTimestamp;
  }

  if (validateText(detailsData)) {
    activityState.details = detailsData;
  }

  if (validateText(stateData)) {
    activityState.state = stateData
  }

  if (validateText(largeImageKeyData)) {
    activityState.largeImageKey = largeImageKeyData;
  }

  if (validateText(largeImageTextData)) {
    activityState.largeImageText = largeImageTextData;
  }

  console.log("Received POST request:", activityState);
  updatePresence(activityState);
  res.json({ message: "Status updated successfully" });
});

// GET endpoint
app.get("/update", (req, res) => {
  const {
    state,
    details,
    largeImageKey,
    largeImageText,
    smallImageKey,
    smallImageText,
    buttonLabel,
    buttonUrl,
  } = req.query;
  updatePresence({
    state,
    details,
    largeImageKey,
    largeImageText,
    // smallImageKey,
    // smallImageText,
    // buttonLabel,
    // buttonUrl,
  });
  res.json({ message: "Status updated successfully" });
});

// DELETE endpoint
app.delete("/update", async (req, res) => {
  await clearStatus();
  res.json({ message: "Status cleared successfully" });
});

// Handle exit signals
process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  handleExit();
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  handleExit();
});

// Start the server
const port = 3003;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle server close
server.on("close", () => {
  console.log("Express server closed");
  handleExit();
});
