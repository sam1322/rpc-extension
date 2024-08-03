const DiscordRPC = require("discord-rpc");
const express = require("express");
const bodyParser = require("body-parser");
const { validateTimeStamp, validateText } = require("./validations");

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const clientId = process.env.DISCORD_CLIENT_ID; // Replace with your actual client ID
const postgresHost = process.env.POSTGRES_HOST
const postgresDatabase = process.env.POSTGRES_DB
const postgresPassword = process.env.POSTGRES_PASSWORD
const postgresUser = process.env.POSTGRES_USER

const rpc = new DiscordRPC.Client({ transport: "ipc" });

const pg = require('pg'); // Replace with your chosen library
const { updatePresence } = require("./DiscordActivity/update-discord");
const { handleExit, clearStatus } = require("./DiscordActivity/clearStatus");
const { updateDiscordActivity } = require("./DiscordActivity/update-discord");
const { checkConnection } = require("./DiscordActivity/findVideoId");
const { default: axios } = require("axios");

// const pool = new pg.Pool({
//   user: postgresUser,
//   host: postgresHost,
//   database: postgresDatabase,
//   password: postgresPassword,
//   port: 5432,
// });

// Usage:
// checkConnection(pool)
// .then(isConnected => {
//   if (isConnected) {
//     // Perform database operations
//   } else {
//     // Handle connection failure
//   }
// });

let timeout = null;

rpc.on("ready", () => {
  console.log("RPC is running");
});

rpc.login({ clientId }).catch(console.error);

// POST endpoint
app.post("/update", (req, res) => updateDiscordActivity(req, res, rpc));


// DELETE endpoint
app.delete("/update", async (req, res) => {
  await clearStatus(rpc);
  res.json({ message: "Status cleared successfully" });
});


// POST endpoint
app.post("/updateApk", async (req, res) => {
  // await clearStatus();
  // console.log("hello calling update  apk", req.body)
  const { title: videoTitle, message: channelName, timestamp, actions } = req.body

  const isPlaying = actions.includes("Pause")


  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(async () => {
    await setDiscordActivity(videoTitle, channelName, isPlaying);
  }, 1000); // Adjust the delay as necessary


  res.json({ message: "post api called successfully" });
});


const setDiscordActivity = async (title, artist, isPlaying) => {
  console.log("title: ", title, "channelName:", artist)

  const resp = await axios.post("http://localhost:8080/youtube", {
    title: title,
    channelName: artist,
  });
  if (resp.status === 200) {
    console.log("DiscordActivity updated")
    const data = resp.data
    console.log()
    const videoId = data?.videoId
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    const activityState = {
      smallImageKey: isPlaying ? "https://res.cloudinary.com/dw5xqmxyu/image/upload/v1721882387/play4_kppcqd.png" : "https://res.cloudinary.com/dw5xqmxyu/image/upload/v1721882388/pause3_ashttx.png",
      smallImageText: isPlaying ? "Playing" : "Paused",
      largeImageKey: thumbnail,
      largeImageText: "Playing on Android",
    };

    if (validateText(data?.title)) {
      activityState.details = data?.title;
    }

    if (validateText(data?.channelName)) {
      activityState.state = data?.channelName;
    }


    console.log("Received POST request:", activityState);
    updatePresence(rpc, activityState);
  }

}


// DELETE endpoint
app.get("/updateApk", async (req, res) => {
  // await clearStatus();
  console.log("get api")
  res.json({ message: "get api called successfully" });
});


// Handle exit signals
process.on("SIGINT", () => handleExit(rpc));
process.on("SIGTERM", () => handleExit(rpc));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  handleExit(rpc);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  handleExit(rpc);
});

// Start the server
const port = 3003;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle server close
server.on("close", () => {
  console.log("Express server closed");
  handleExit(rpc);
});
