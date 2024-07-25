
let currentVideoId = null;
let currentVideoInfo = null;

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
  return urlParams.get('v');
}

function sendToBackgroundScript(videoInfo) {
  chrome.runtime.sendMessage({ type: 'sendToApi', videoInfo: videoInfo });
}

function sendToApi(videoInfo) {
  // Replace with your actual API endpoint
  console.log("videoInfo", videoInfo)
  // return;
  const apiUrl = 'http://localhost:3003/update';

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(videoInfo),
  })
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch((error) => console.log('Error:', error));
}

async function checkAndSendVideoState() {
  const videoInfo = await getVideoInfo();
  if (videoInfo) {
    sendToBackgroundScript(videoInfo);
    // sendToApi(videoInfo);
  }
}
 
// Run when the page loads
window.addEventListener('load', () => setTimeout(checkAndSendVideoState, 3500));

// Watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
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