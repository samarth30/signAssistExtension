import { fetchSimulate, ResponseType } from './serverModule';
import type { SimulateRequestArgs } from './gloabals';
import type { Simulation } from './simulationModule';

export enum StoredSimulationState {
  // Currently in the process of simulating.
  Simulating = 'Simulating',

  // Reverted
  Revert = 'Revert',

  // Error
  Error = 'Error',

  // Successful simulation
  Success = 'Success',

  // User has rejected.
  Rejected = 'Reject',

  // User has requested we keep going. This could be confirming or skipping.
  Confirmed = 'Confirm',
}

export interface StoredSimulation {
  id: string;

  /// The state this simulation is in.
  state: StoredSimulationState;

  /// Simulation set on success.
  simulation?: Simulation;

  /// Optional error message on Error
  error?: string;
}

/**
 * Location where we store StoredSimulation[]
 */
export const STORAGE_KEY = 'simulations';

export const addSimulation = async (simulation: StoredSimulation) => {
  return chrome.storage.sync.set({ simulations: [simulation] });
};

export const setSimulationNull = async () => {
  return chrome.storage.sync.set({ simulations: [] });
};

const completeSimulation = async (id: string, simulation: Simulation) => {
  const { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  simulations.forEach((storedSimulation: StoredSimulation) => {
    if (storedSimulation.id === id) {
      storedSimulation.state = StoredSimulationState.Success;
      storedSimulation.simulation = simulation;
    }
  });

  return chrome.storage.sync.set({ simulations });
};

const revertSimulation = async (id: string, error?: string) => {
  const { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  simulations.forEach((storedSimulation: StoredSimulation) => {
    if (storedSimulation.id === id) {
      storedSimulation.state = StoredSimulationState.Revert;
      storedSimulation.error = error;
    }
  });

  return chrome.storage.sync.set({ simulations });
};

export const removeSimulation = async (id: string) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  simulations = simulations.filter((storedSimulation: StoredSimulation) => {
    return storedSimulation.id !== id;
  });

  return chrome.storage.sync.set({ simulations });
};

export const updateSimulationState = async (
  id: string,
  state: StoredSimulationState
) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  simulations = simulations.map((x: StoredSimulation) =>
    x.id === id
      ? {
          ...x,
          state,
        }
      : x
  );

  return chrome.storage.sync.set({ simulations });
};

const updateSimulatioWithErrorMsg = async (id: string, error?: string) => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  simulations = simulations.map((x: StoredSimulation) =>
    x.id === id
      ? {
          ...x,
          error,
          state: StoredSimulationState.Error,
        }
      : x
  );

  return chrome.storage.sync.set({ simulations });
};

export const fetchSimulationAndUpdate = async (
  simulateArgs: SimulateRequestArgs
) => {
  // Add a pending simulation, and shoot of a request at the same time.
  const [, response] = await Promise.all([
    addSimulation({
      id: simulateArgs.id,
      state: StoredSimulationState.Simulating,
    }),
    fetchSimulate(simulateArgs),
  ]);
  console.log(response, 'simulation');
  if (response.type === ResponseType.Error) {
    return updateSimulatioWithErrorMsg(simulateArgs.id, response.error);
  }
  if (response.type === ResponseType.Revert) {
    return revertSimulation(simulateArgs.id, response.error);
  }
  if (response.type === ResponseType.Success) {
    if (!response.simulation) {
      throw new Error('Invalid state');
    }
    return completeSimulation(simulateArgs.id, response.simulation);
  }
};

export const clearOldSimulations = async () => {
  let { simulations = [] } = await chrome.storage.sync.get(STORAGE_KEY);

  // Remove confirmed/rejected simulations.
  simulations = simulations.filter(
    (x: StoredSimulation) =>
      x.state !== StoredSimulationState.Rejected &&
      x.state !== StoredSimulationState.Confirmed
  );

  return chrome.storage.sync.set({ simulations });
};

export const simulationNeedsAction = (
  state: StoredSimulationState
): boolean => {
  return (
    state === StoredSimulationState.Success ||
    state === StoredSimulationState.Error ||
    state === StoredSimulationState.Simulating ||
    state === StoredSimulationState.Revert
  );
};
