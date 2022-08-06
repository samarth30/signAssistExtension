export const DISPATCH_SIMULATE_REQUEST =
  'SIGN_ASSIST_DISPATCH_SIMULATE_REQUEST';

export const SIMULATE_REQUEST_COMMAND = 'simulateTransaction';

export interface Transaction {
  /**
   * Address we are sending from
   */
  from: string;

  /**
   * Address we are sending to.
   */
  to: string;

  /**
   * Optional data to send.
   */
  data?: string;

  /**
   * Optional value to send.
   */
  value?: string;
}

export interface SimulateRequestArgs {
  /**
   * UUID for this request.
   */
  id: string;

  /**
   * Chain ID for this request in string.
   */
  website: string;

  /**
   * Chain ID for this request in hex.
   */
  chainId: string;

  /**
   * Transaction we want to forward.
   */
  transaction: Transaction;
}
