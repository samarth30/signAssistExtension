import {
  removeSimulation,
  setSimulationNull,
  StoredSimulationState,
} from '../../modules/storageModule';
import { v4 as uuidv4 } from 'uuid';
import {
  DISPATCH_SIMULATE_REQUEST,
  SIMULATE_REQUEST_COMMAND,
} from '../../modules/gloabals';

let ids = [];

const maybeRemoveId = (id) => {
  if (ids.includes(id)) {
    ids = ids.filter((thisId) => thisId !== id);
    removeSimulation(id);
  }
};

document.addEventListener(DISPATCH_SIMULATE_REQUEST, (event) => {
  console.log(event);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.simulations?.newValue) {
      const newSimulations = changes.simulations.newValue;

      newSimulations.forEach((simulation) => {
        // Either dispatch the corresponding event, or push the item to new simulations.
        if (simulation.state === StoredSimulationState.Confirmed) {
          // dispatchSimulateResponse({
          //   id: simulation.id,
          //   type: SimulateResponse.Continue,
          // });
          maybeRemoveId(simulation.id);
        } else if (simulation.state === StoredSimulationState.Rejected) {
          // dispatchSimulateResponse({
          //   id: simulation.id,
          //   type: SimulateResponse.Reject,
          // });
          maybeRemoveId(simulation.id);
        }
      });
    }
  });

  chrome.runtime.sendMessage({
    command: SIMULATE_REQUEST_COMMAND,
    data: event.detail,
  });
});

let chainIdEventId = 0,
  CHAIN_ID;

function eventListener() {
  window.addEventListener(
    'message',
    async (event) => {
      // console.log(event);
      // event.data.data.error.code === 4001
      if (
        event.data
        // &&
        // event?.data?.name?.includes('metamask')
        // (event.data?.data?.data?.method === 'eth_sendTransaction' ||
        //   event.data?.data?.data?.method === 'eth_signTypedData_v4')
      ) {
        try {
          // console.log(CHAIN_ID);
          if (!CHAIN_ID) {
            if (
              chainIdEventId !== 0 &&
              event.data?.data?.data?.id === chainIdEventId
            ) {
              CHAIN_ID = event.data?.data?.data?.result;
            }

            if (event.data?.data?.data?.method === 'eth_chainId') {
              chainIdEventId = event.data?.data?.data?.id;
            }
          }

          if (event.data?.data?.data?.method === 'metamask_chainChanged') {
            CHAIN_ID = event.data?.data?.data?.params['chainId'];
          }

          if (event.data?.data?.data?.method === 'eth_sendTransaction') {
            console.log(CHAIN_ID);
            console.log(event.data?.data?.data?.params[0]);
            setSimulationNull();
            document.dispatchEvent(
              new CustomEvent(DISPATCH_SIMULATE_REQUEST, {
                detail: {
                  id: uuidv4(),
                  website: window.location.origin,
                  chainId: CHAIN_ID,
                  transaction: event.data?.data?.data?.params[0],
                },
              })
            );
          }

          if (event.data?.data?.data?.method === 'eth_signTypedData_v4') {
            // console.log(event.data?.data?.data);
            // console.log(event.data?.data?.data?.params);
          }
        } catch (e) {
          console.log(e);
        }
      }
    },
    false
  );
}

eventListener();
