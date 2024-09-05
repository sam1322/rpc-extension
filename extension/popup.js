// document.addEventListener('DOMContentLoaded', function() {
//   console.log('Extension popup opened');
// });

document.addEventListener("DOMContentLoaded", function () {
  var toggleSwitch = document.getElementById("activationToggle");
  var toggleYtSwitch = document.getElementById("activateYtToggle");
  var toggleYtMusicSwitch = document.getElementById("activateYtMusicToggle");

  var statusText = document.getElementById("status");
  var ytStatusText = document.getElementById("youtube-status");
  var ytMusicStatusText = document.getElementById("youtube-music-status");

  var ytIcon = document.getElementById("ytIcon");
  var ytMusicIcon = document.getElementById("ytMusicIcon");

  console.log("Extension popup opened");
  // Load the current state
  chrome.storage.sync.get("isActive", function (data) {
    toggleSwitch.checked = data.isActive;
    updateStatus(data.isActive);
  });

  chrome.storage.sync.get("isYtActive", function (data) {
    toggleYtSwitch.checked = data.isYtActive;
    updateYtStatus(data.isYtActive);
  });

  chrome.storage.sync.get("isYtMusicActive", function (data) {
    toggleYtMusicSwitch.checked = data.isYtMusicActive;
    updateYtMusicStatus(data.isYtMusicActive);
  });

  toggleSwitch.addEventListener("change", function () {
    var isActive = this.checked;
    chrome.storage.sync.set({ isActive: isActive }, function () {
      updateStatus(isActive);
      // Notify the background script
      chrome.runtime.sendMessage({
        action: "toggleExtension",
        isActive: isActive,
      });
    });
  });

  toggleYtSwitch.addEventListener("change", function () {
    var isActive = this.checked;
    chrome.storage.sync.set({ isYtActive: isActive }, function () {
      updateYtStatus(isActive);
      // Notify the background script
      chrome.runtime.sendMessage({
        action: "toggleYtActivity",
        isActive: isActive,
      });
    });
  });

  toggleYtMusicSwitch.addEventListener("change", function () {
    var isActive = this.checked;
    chrome.storage.sync.set({ isYtMusicActive: isActive }, function () {
      updateYtMusicStatus(isActive);
      // Notify the background script
      chrome.runtime.sendMessage({
        action: "toggleYtActivity",
        isActive: isActive,
      });
    });
  });

  function updateStatus(isActive) {
    statusText.textContent = isActive
      ? "Extension is active"
      : "Extension is inactive";
  }

  function updateYtStatus(isActive) {
    ytStatusText.textContent = isActive
      ? "Youtube is active"
      : "Youtube is inactive";
    ytIcon.style.opacity = isActive ? 1 : 0.5;
  }

  function updateYtMusicStatus(isActive) {
    ytMusicStatusText.textContent = isActive
      ? "Youtube Music is active"
      : "Youtube Music is inactive";
    ytMusicIcon.style.opacity = isActive ? 1 : 0.5;
  }
});
