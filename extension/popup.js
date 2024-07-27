// document.addEventListener('DOMContentLoaded', function() {
//   console.log('Extension popup opened');
// });

document.addEventListener('DOMContentLoaded', function () {
  var toggleSwitch = document.getElementById('activationToggle');
  var statusText = document.getElementById('status');
  console.log('Extension popup opened');
  // Load the current state
  chrome.storage.sync.get('isActive', function (data) {
    toggleSwitch.checked = data.isActive;
    updateStatus(data.isActive);
  });

  toggleSwitch.addEventListener('change', function () {
    var isActive = this.checked;
    chrome.storage.sync.set({ isActive: isActive }, function () {
      updateStatus(isActive);
      // Notify the background script
      chrome.runtime.sendMessage({ action: "toggleExtension", isActive: isActive });
    });
  });

  function updateStatus(isActive) {
    statusText.textContent = isActive ? "Extension is active" : "Extension is inactive";
  }
});