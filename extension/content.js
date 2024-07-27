
let currentVideoId = null;
let currentVideoInfo = null;
let isExtensionActive = true;

// Function to check extension activation state
function checkActivationState() {
  chrome.storage.sync.get('isActive', function (data) {
    isExtensionActive = data.isActive;
  });
}

// Check activation state when the script loads
checkActivationState();

// Listen for changes in activation state
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (changes.isActive) {
    console.log('isActive changed to', changes.isActive.newValue);
    isExtensionActive = changes.isActive.newValue;
    if (isExtensionActive) {
      // checkAndSendVideoState()
    }
    else {
      clearState()
    }
  }
});

async function getVideoInfo() {
  const videoId = getVideoId();
  let data = null

  if (currentVideoInfo == null || currentVideoInfo?.videoId != videoId) {
    const resp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
    data = await resp.json();
    currentVideoInfo = data;
    currentVideoInfo.videoId = videoId;
    console.log("calling api")
  }
  else {
    data = currentVideoInfo;
  }

  console.log("data", data)

  const videoElement = document.querySelector('video');
  const titleElement = document.querySelector('h1.ytd-watch-metadata');
  const channelElement = document.querySelector('#text.ytd-channel-name a');

  if (!data?.title && (!videoElement || !titleElement || !channelElement)) {
    return null;
  }

  return {
    videoId: videoId,
    title: data?.title?.trim() ?? titleElement?.textContent?.trim(),
    url: window.location.href,
    thumbnail: data?.thumbnail_url ?? `https://img.youtube.com/vi/${videoId}/0.jpg`,
    isPlaying: !videoElement?.paused,
    channelName: data?.author_name ?? channelElement?.textContent?.trim(),
    channelUrl: data?.author_url ?? channelElement?.href,
  };
}


function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('v');
  if (!id) {
    id = window.location.pathname.split("/").pop();
  }
  return id;
}

function sendToBackgroundScript(videoInfo) {
  chrome.runtime.sendMessage({ type: 'sendToApi', videoInfo: videoInfo });
}

function clearDiscordActivity() {
  chrome.runtime.sendMessage({ type: 'clearActivity' });
}


async function checkAndSendVideoState() {
  console.log("isActive", isExtensionActive)
  if (!isExtensionActive) {
    console.log("currentVideoId2", currentVideoId)
    clearState()
    return;
  }

  const videoInfo = await getVideoInfo();
  if (currentVideoId == null) {
    currentVideoId = videoInfo.videoId;
  }
  if (videoInfo) {
    sendToBackgroundScript(videoInfo);
    // sendToApi(videoInfo);
  }
}

// Run when the page loads
window.addEventListener('load', () => setTimeout(checkAndSendVideoState, 3500));

const clearState = () => {
  if (currentVideoId) {
    clearDiscordActivity()
    currentVideoId = null;
  }
}

// Watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  if (!isExtensionActive) {
    clearState()
    return;
  }
  const newUrl = location.href;
  if (newUrl !== lastUrl) {
    lastUrl = newUrl;
    const newVideoId = getVideoId();
    if (newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      setTimeout(checkAndSendVideoState, 3500); // 3.5-second delay
    }
  }
}).observe(document, { subtree: true, childList: true });

// Listen for play/pause events
document.addEventListener('play', checkAndSendVideoState, true);
document.addEventListener('pause', checkAndSendVideoState, true);