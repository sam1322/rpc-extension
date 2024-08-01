const { validateText, validateTimeStamp } = require("../validations");

// Function to update Rich Presence
function updatePresence(rpc, activityState) {
    rpc.setActivity(activityState);
}

const updateDiscordActivity = async (req, res, rpc) => {
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
    updatePresence(rpc, activityState);
    res.json({ message: "Status updated successfully" });
}

module.exports = {
    updatePresence,
    updateDiscordActivity
}