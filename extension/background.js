chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendToApi') {
        sendToApi(message.videoInfo);
    }
    else if (message.type === "clearActivity") {
        clearActivity();
    }
    // for changing icon
    // else if (request.action === "toggleExtension") {
    //     updateIcon(request.isActive);
    // }
});

// // In your background.js
// function updateIcon(isActive) {
//     const path = isActive ? {
//         "16": "icons/icon16.png",
//         "32": "icons/icon32.png",
//         "48": "icons/icon48.png",
//         "128": "icons/icon128.png"
//     } : {
//         "16": "icons/icon16.png",
//         "32": "icons/icon32.png",
//         "48": "icons/icon48.png",
//         "128": "icons/icon128.png"
//     };

//     chrome.action.setIcon({ path: path });
// }



// function sendToApi(videoInfo) {
//   const apiUrl = 'http://localhost:3000/video-info'; // Replace with your actual API endpoint

//   fetch(apiUrl, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(videoInfo),
//   })
//   .then(response => response.json())
//   .then(data => console.log('Success:', data))
//   .catch((error) => console.error('Error:', error));
// }

function sendToApi(videoInfo) {
    // Replace with your actual API endpoint
    console.log("videoInfo", videoInfo)
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


function clearActivity() {
    const apiUrl = 'http://localhost:3003/update';

    fetch(apiUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify(videoInfo),
    })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch((error) => console.log('Error:', error));
}



