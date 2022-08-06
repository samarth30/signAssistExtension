import config from '../config';

import type { Transaction } from './gloabals';
import { Simulation } from './simulationModule';

// Will change depending on if dev or not.
const SERVER_URL = config.server;

export enum ResponseType {
  Success = 'success',
  Revert = 'revert',
  Error = 'error',
}

export interface Response {
  type: ResponseType;

  // Only set on success.
  simulation?: Simulation;

  // Might be set on error.
  error?: string;
}

export const fetchSimulate = async (args: {
  website: string;
  chainId: string;
  transaction: Transaction;
}): Promise<Response> => {
  try {
    console.log(args.transaction);
    var raw = JSON.stringify({
      website: args.website,
      transactionParameters: [
        {
          ...args.transaction,
        },
      ],
    });
    console.log(raw);
    const result = await fetch(`${SERVER_URL}`, {
      method: 'POST',
      headers: {
        // Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: raw,
      redirect: 'follow',
    });
    console.log(result);
    if (result.status === 200) {
      console.log(result);
      const data = await result.json();

      if (data.success) {
        return {
          type: ResponseType.Success,
          simulation: Simulation.fromJSON(data.simulation),
        };
      }
      return {
        type: ResponseType.Revert,
        error: data.error,
      };
    }
    const { error } = await result.json();
    return { type: ResponseType.Error, error };
  } catch (e: any) {
    return { error: e.message, type: ResponseType.Error };
  }
};
