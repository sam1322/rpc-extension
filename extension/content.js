// function getVideoInfo() {
//     const videoElement = document.querySelector('video');
//     if (!videoElement) return null;

//     const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent;
//     const videoUrl = window.location.href;
//     const thumbnailUrl = `https://img.youtube.com/vi/${getVideoId()}/0.jpg`;
//     const isPlaying = !videoElement.paused;

//     // Get channel name
//     const channelElement = document.querySelector('#text.ytd-channel-name a');
//     const channelName = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
//     return {
//         title: videoTitle?.trim(),
//         url: videoUrl,
//         thumbnail: thumbnailUrl,
//         channelName: channelName,
//         isPlaying: isPlaying
//     };
// }

// function getVideoInfo() {
//     return new Promise((resolve, reject) => {
//         const maxRetries = 3;
//         let retries = 0;

//         function extractInfo() {
//             const videoElement = document.querySelector('video');
//             if (!videoElement) {
//                 reject(new Error('Video element not found'));
//                 return;
//             }

//             const videoTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim();
//             const channelElement = document.querySelector('#text.ytd-channel-name a');
//             const channelName = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';

//             if (!videoTitle || channelName === 'Unknown Channel') {
//                 if (retries < maxRetries) {
//                     retries++;
//                     setTimeout(extractInfo, 2000); // Retry after 2 seconds
//                     return;
//                 }
//             }

//             resolve({
//                 title: videoTitle || 'Unknown Title',
//                 url: window.location.href,
//                 thumbnail: `https://img.youtube.com/vi/${getVideoId()}/0.jpg`,
//                 channelName: channelName,
//                 isPlaying: !videoElement.paused
//             });
//         }
//         // setTimeout(extractInfo, 2000);
//         extractInfo();
//     });
// }

let currentVideoId = null;

function getVideoInfo() {
  const videoElement = document.querySelector('video');
  const titleElement = document.querySelector('h1.ytd-watch-metadata');
  const channelElement = document.querySelector('#text.ytd-channel-name a');

  if (!videoElement || !titleElement || !channelElement) {
    return null;
  }

  return {
    title: titleElement?.textContent?.trim(),
    url: window.location.href,
    thumbnail: `https://img.youtube.com/vi/${getVideoId()}/0.jpg`,
    isPlaying: !videoElement?.paused,
    channelName: channelElement?.textContent?.trim()
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
    const apiUrl = 'http://localhost:3000/update';

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
    const videoInfo = getVideoInfo();
    if (videoInfo) {
        sendToBackgroundScript(videoInfo);
        // sendToApi(videoInfo);
    }
}

// Run when the page loads
// window.addEventListener('load', checkAndSendVideoState);

// // Also run when the URL changes (for SPA navigation)
// let lastUrl = location.href;
// new MutationObserver(() => {
//     const url = location.href;
//     if (url !== lastUrl) {
//         lastUrl = url;
//         const videoInfo = getVideoInfo();
//         if (videoInfo) {
//             sendToApi(videoInfo);
//         }
//     }
// }).observe(document, { subtree: true, childList: true });

// Run when the page loads
window.addEventListener('load', () => setTimeout(checkAndSendVideoState, 2000));

// Watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const newUrl = location.href;
  if (newUrl !== lastUrl) {
    lastUrl = newUrl;
    const newVideoId = getVideoId();
    if (newVideoId !== currentVideoId) {
      currentVideoId = newVideoId;
      setTimeout(checkAndSendVideoState, 2000); // 2-second delay
    }
  }
}).observe(document, {subtree: true, childList: true});

// Listen for play/pause events
document.addEventListener('play', checkAndSendVideoState, true);
document.addEventListener('pause', checkAndSendVideoState, true);