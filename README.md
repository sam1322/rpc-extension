<!-- # rpc-extension -->
# YouTube Video Info Chrome Extension

## Description
This Chrome extension captures information about the currently playing YouTube video and sends it to a specified API. It's designed to work seamlessly with YouTube's single-page application structure, providing real-time updates as users navigate between videos.

## Features
- Captures video title, URL, thumbnail, channel name, and play state
- Sends video information to a specified API
- Updates information when navigating between videos
- Detects play/pause events

## Installation
1. Clone this repository or download the ZIP file.
2. This project requires **Nodejs** to be preinstalled, so if it isn't installed then please install it first.
3. After that navigate to nodejs directory inside the repo and install all the npm modules by running npm i in the terminal
4. After that simply run the nodejs server by running **npm run start** in the terminal
5. Before that you will be required to provide your discord client id in .env file
6. If you don't know how to get a discord client id from your discord application  then please search  online.After running your nodejs server successfully, Open Chrome and navigate to `chrome://extensions/`


7. Enable "Developer mode" in the top right corner.![Screenshot from 2024-07-27 19-02-16](https://github.com/user-attachments/assets/eef7a559-2fc1-420f-b14d-791ce157cb5e)

8. Click "Load unpacked" and select the directory containing the extension files ie the extension directory.
9. After this your extension is installed
    ![image](https://github.com/user-attachments/assets/908bcc07-d57e-43ac-964d-da2acffd16a2)



## Usage
1. Navigate to any YouTube video page.
2. The extension will automatically capture video information and send it to the specified API.
3. Information is updated when:
   - A new video page is loaded
   - The user navigates to a different video
   - The video is played or paused

## Configuration
To configure the API endpoint:
1. Open `background.js`
2. Locate the `sendToApi` function
3. Replace `'http://localhost:3003/update'` with your desired API endpoint

## Files
- `manifest.json`: Extension configuration
- `content.js`: Content script that runs on YouTube pages
- `background.js`: Background script for making API calls
- `popup.html` & `popup.js`: (Optional) Extension popup interface

## Development
To modify or extend this extension:
1. Make changes to the relevant files (`content.js` for YouTube page interactions, `background.js` for API communication)
2. Reload the extension in `chrome://extensions/`
3. Test on YouTube to ensure proper functionality

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
[Specify your license here, e.g., MIT License]

## Disclaimer
This extension is not affiliated with or endorsed by YouTube. Use responsibly and in accordance with YouTube's terms of service.
