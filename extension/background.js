chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'sendToApi') {
        sendToApi(message.videoInfo);
    }
    // else if (message.type === "clearActivity") {
    //     clearActivity();
    // }

});

// In your background.js
function updateIcon(isActive) {
    const path = isActive ? {
        "16": "icons/icon16.png",
        "32": "icons/icon32.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
    } : {
        "16": "icons_disabled/icon16.png",
        "32": "icons_disabled/icon32.png",
        "48": "icons_disabled/icon48.png",
        "128": "icons_disabled/icon128.png"
    };

    chrome.action.setIcon({ path: path });
    if (!isActive) {
        clearActivity();
    }
}



// Initialize the icon state when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get('isActive', (data) => {
        updateIcon(data.isActive);
    });
});

// Listen for messages to update the icon
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleExtension") {
        updateIcon(request.isActive);
    }
});

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



