import { SIMULATE_REQUEST_COMMAND } from '../../modules/gloabals';
import {
  clearOldSimulations,
  fetchSimulationAndUpdate,
  simulationNeedsAction,
} from '../../modules/storageModule';

console.log('This is the background page.');
console.log('Put the background scripts here.');

let currentPopup;

chrome.windows.onRemoved.addListener(
  (windowId) => {
    if (currentPopup && currentPopup === windowId) {
      currentPopup = undefined;
    }
  },
  {
    windowTypes: ['popup'],
  }
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.simulations?.newValue) {
    const oldSimulations = changes.simulations.oldValue;
    const newSimulations = changes.simulations.newValue;

    const oldFiltered = oldSimulations?.filter((storedSimulation) => {
      return simulationNeedsAction(storedSimulation.state);
    });
    const newFiltered = newSimulations.filter((storedSimulation) => {
      return simulationNeedsAction(storedSimulation.state);
    });

    if (
      !currentPopup &&
      (!oldFiltered || newFiltered.length > oldFiltered.length)
    ) {
      currentPopup = -1;

      setTimeout(() => {
        chrome.windows.create(
          {
            url: 'popup.html',
            type: 'popup',
            width: 360,
            height: 620,
          },
          (createdWindow) => {
            currentPopup = createdWindow?.id;
          }
        );
      }, 1500);

      return;
    }

    if (
      newFiltered.length === 0 &&
      oldFiltered.length === 1 &&
      currentPopup &&
      currentPopup !== -1
    ) {
      const closeId = currentPopup;
      currentPopup = undefined;
      chrome.windows.remove(closeId);

      return;
    }

    // Let's send it to the front if it already exists
    if (currentPopup && currentPopup !== -1) {
      chrome.windows.update(currentPopup, {
        focused: true,
      });
    }
  }
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.command === SIMULATE_REQUEST_COMMAND) {
    const args = request.data;
    clearOldSimulations().then(() => fetchSimulationAndUpdate(args));
  } else {
  }
});
