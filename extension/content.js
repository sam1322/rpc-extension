let currentVideoId = null;
let currentVideoInfo = null;
let isExtensionActive = true;
let isYoutubeActive = true;
let isYoutubeMusicActive = true;

// Function to check extension activation state
function checkActivationState() {
  chrome.storage.sync.get("isActive", function (data) {
    isExtensionActive = data.isActive;
  });
  chrome.storage.sync.get("isYtActive", function (data) {
    isYoutubeMusicActive = data.isYtActive;
  });
  chrome.storage.sync.get("isYtMusicActive", function (data) {
    isYoutubeMusicActive = data.isYtMusicActive;
  });
}

// Check activation state when the script loads
checkActivationState();

// Listen for changes in activation state
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.isActive) {
    // console.log("isActive changed to", changes.isActive.newValue);
    isExtensionActive = changes.isActive.newValue;
  }
  if (changes.isYtActive) {
    // console.log("isActive changed to", changes.isActive.newValue);
    isYoutubeActive = changes.isYtActive.newValue;
  }
  if (changes.isYtMusicActive) {
    // console.log("isActive changed to", changes.isActive.newValue);
    isYoutubeMusicActive = changes.isYtMusicActive.newValue;
  }
});

let elapsedStartTimestamp = null;

async function getVideoInfo() {
  const videoId = getVideoId();
  let data = null;

  if (currentVideoInfo == null || currentVideoInfo?.videoId != videoId) {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (resp.status == 200) {
      data = await resp.json();
      currentVideoInfo = data;
      currentVideoInfo.videoId = videoId;
      console.log("calling api");
    }
  } else {
    data = currentVideoInfo;
  }

  console.log("data", data);

  const videoElement = document.querySelector("video");
  const titleElement = document.querySelector("h1.ytd-watch-metadata");
  const channelElement = document.querySelector("#text.ytd-channel-name a");

  if (!data?.title && (!videoElement || !titleElement || !channelElement)) {
    return null;
  }

  let currentTimestamp = videoElement.currentTime;
  let videoDuration = videoElement.duration;

  let dateNow = Date.now() / 1000;

  // Adjust start timestamp to match current position only when playing
  let startTimestamp = Math.floor(dateNow - currentTimestamp);
  if (!videoElement?.paused && !elapsedStartTimestamp) {
    elapsedStartTimestamp = startTimestamp;
  }

  let endTimestamp = Math.floor(dateNow - currentTimestamp + videoDuration); // Adjust end timestamp to match video duration

  return {
    videoId: videoId,
    title: data?.title?.trim() ?? titleElement?.textContent?.trim(),
    url: window.location.href,
    thumbnail:
      data?.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/0.jpg`,
    isPlaying: !videoElement?.paused,
    channelName: data?.author_name ?? channelElement?.textContent?.trim(),
    channelUrl: data?.author_url ?? channelElement?.href,
    startTimestamp: videoElement?.paused
      ? elapsedStartTimestamp
      : startTimestamp,
    endTimestamp: videoElement?.paused ? null : endTimestamp,
  };
}

function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get("v");
  if (!id) {
    id = window.location.pathname.split("/").pop();
  }
  return id;
}

function getPlatform() {
  const url = new URL(window.location.href);
  const hostname = url.hostname;
  const urlParams = new URLSearchParams(url.search);
  let id = urlParams.get("v");
  let platform;
  
  if (hostname.includes("music.youtube.com")) {
    platform = "youtubeMusic";
    if (!id) {
      id = urlParams.get("v") || url.pathname.split("/").pop();
    }
  } else if (hostname.includes("youtube.com")) {
    platform = "youtube";
    if (!id) {
      id = url.pathname.split("/").pop();
    }
  } else {
    platform = "unknown";
  }

  return { id, platform };
}

function sendToBackgroundScript(videoInfo) {
  chrome.runtime.sendMessage({ type: "sendToApi", videoInfo: videoInfo });
}

function clearDiscordActivity() {
  chrome.runtime.sendMessage({ type: "clearActivity" });
}

async function checkAndSendVideoState() {
  console.log("isActive", isExtensionActive);
  if (!isExtensionActive) {
    return;
  }
  console.log("isYoutubeActive", isYoutubeActive);
  console.log("isYoutubeMusicActive", isYoutubeMusicActive);
  console.log("platform", getPlatform().platform);
  if (!isYoutubeActive && getPlatform().platform == "youtube") {
    return;
  }
  if (!isYoutubeMusicActive && getPlatform().platform == "youtubeMusic") {
    return;
  }

  const videoInfo = await getVideoInfo();
  console.log("videoInfo", videoInfo);
  if (currentVideoId == null) {
    currentVideoId = videoInfo.videoId;
  }
  if (videoInfo) {
    sendToBackgroundScript(videoInfo);
    // sendToApi(videoInfo);
  }
}

// Run when the page loads
window.addEventListener("load", () => setTimeout(checkAndSendVideoState, 3500));

const clearState = () => {
  if (currentVideoId) {
    clearDiscordActivity();
    currentVideoId = null;
  }
};

// Watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (!isExtensionActive) {
    return;
  }
  const newUrl = location.href;
  if (newUrl !== lastUrl) {
    lastUrl = newUrl;
    const newVideoId = getVideoId();
    if (newVideoId !== currentVideoId) {
      elapsedStartTimestamp = null;
      currentVideoId = newVideoId;
      setTimeout(checkAndSendVideoState, 3500); // 3.5-second delay
    }
  }
}).observe(document, { subtree: true, childList: true });

// Listen for play/pause events
document.addEventListener("play", checkAndSendVideoState, true);
document.addEventListener("pause", checkAndSendVideoState, true);
