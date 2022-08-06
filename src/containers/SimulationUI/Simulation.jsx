import { utils, BigNumber } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useChromeStorageSync } from 'use-chrome-storage';
import { Simulation, EventType, TokenType } from '../../modules/simulationModule';
import { Audio, Circles } from 'react-loader-spinner'
import ContentLoader from 'react-content-loader'
import {
  STORAGE_KEY,
  simulationNeedsAction,
  StoredSimulationState,
  updateSimulationState,
} from '../../modules/storageModule';

const NoTransactionComponent = () => {
  return (
    // TODO Simple Page Image if no transaction
    <div className="text-lg text-center p-5">
      <img className="m-auto w-24" src="transparentbg.png" alt="" />
      <div className="p-2 text-gray-100">
        Trigger a transaction to get started.
      </div>
    </div>
  );
};

/**
 * Pass in a hex string, get out the parsed amount.
 *
 * If the amount is undefined or null, the return will be 1.
 */
const getFormattedAmount = (
  amount,
  decimals
) => {
  if (!amount) {
    return '1';
  }

  if (!decimals) {
    decimals = 0;
  }

  if (amount === '0x') {
    return '0';
  }

  const amountParsed = BigNumber.from(amount.toString());

  // We're okay to round here a little bit since we're just formatting.
  const amountAsFloatEther = parseFloat(
    utils.formatUnits(amountParsed, decimals)
  );

  let formattedAmount;

  if (amountAsFloatEther > 1 && amountAsFloatEther % 1 !== 0) {
    // Add 4 decimals if it is > 1
    formattedAmount = amountAsFloatEther.toFixed(4);
  } else {
    // Add precision of 4.
    formattedAmount = amountAsFloatEther.toLocaleString('fullwide', {
      useGrouping: false,
      maximumSignificantDigits: 4,
    });
  }

  return formattedAmount;
};

const EventComponent = ({ event }) => {


  const formattedAmount = getFormattedAmount(
    // @ts-ignore
    event.amount === true ? null : event.amount,
    event.decimals ? event.decimals : null
  );

  const message = () => {
    if (
      event.type === EventType.TransferIn ||
      event.type === EventType.TransferOut
    ) {

      return (
        <div
          className={`${event.type === EventType.TransferIn
            ? 'text-mygreen bg-mylightgreen'
            : 'text-red-600 bg-mylightred'
            } ml-auto my-auto text-lg  rounded-xl p-2`}
        >
          {event.type === EventType.TransferIn ? '+' : '-'}

          {event.tokenType === TokenType.ERC721 ? 1 : formattedAmount}{' '}
          {event.tokenType === TokenType.ERC721 ||
            event.tokenType === TokenType.ERC1155
            ? 'NFT'
            : event.symbol}

        </div>
      );
    }
    if (event.type === EventType.Approval) {

      return (
        <div className="text-red-600 bg-mylightred text-base text-center ml-auto my-auto rounded-xl p-1">
          Giving Site Access to {' '}
          {event.tokenType === TokenType.ERC20 ?
            `${formattedAmount && formattedAmount.length > 7 ? `ALL` : formattedAmount} ${event.symbol ? event.symbol : event.name}` : 'Asset'}
        </div>
      );
    }
    if (event.type === EventType.ApprovalForAll) {

      const color = 'text-red-600 bg-mylightred';

      return (
        <div
          className={`${color} ml-auto  my-auto text-base text-center rounded-xl p-1`}
        >
          {/* <div>Can withdraw </div> */}
          {event.tokenType === TokenType.ERC721 ? (
            <div>
              Give Site Access To All NFTs {' '}
              {/* <span className="font-bold"></span>{' '} */}
              <span>from ${event.symbol ? event.symbol : event.name}.</span> Collection
            </div>
          ) : (
            <div>
              Give Site Access To All{' '}
              <span className="font-bold">
                ${event.symbol ? event.symbol : event.name} tokens.
              </span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex justify-between gap-x-2 relative p-2 bg-white">
      <div className="flex gap-x-2 mr-10">
        <img
          className="m-auto"
          src={event.image || 'unknown.png'}
          alt="token"
          width="48"
          height="48"
        />
        <div className="text-xs text-mygray m-auto min-w-auto">
          {event.name || 'Unknown Name'}
          {event.tokenType === TokenType.ERC721 ?
            //  @ts-ignore
            !event.amount ? null : <div className="mt-0"> {event.amount !== true && `# ${formattedAmount}`}</div> : null}
        </div>
      </div>
      <div className='min-w-auto'>
        {message()}
      </div>
    </div>
  );
};

const TransferAllWarning = ({ events }) => {
  const NoApprovalForAll = (
    <div className="text-base text-gray-400 pb-4">
      {/* Changes being made in this transaction */}
    </div>
  );

  if (events.length === 0) {
    return NoApprovalForAll;
  }

  const RemovalTokenMessage = (message, color) => {
    return (
      <div className={`flex gap-x-2 relative p-2 ${color} justify-center`}>
        <div className="flex flex-row justify-center">
          <img
            className="m-auto item-center"
            src={'warningsign.png'}
            alt="token"
            width="60"
            height="48"
          />
          <div className="flex flex-col item-center">
            <div className="text-lg text-white m-auto ml-2 font-bold uppercase">{message}</div>
            <div className="text-sm text-white m-auto ml-2">
              Continue only if you trust the site
            </div>
          </div>
        </div>
      </div>
    );
  };

  // checking for transfer Functions
  // 1 Removal of ETH
  // 2 Removing NFTS
  // 3 Removing Tokens
  let finalEvent;

  // Handling Token Approval Message
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === EventType.Approval) {
      if (
        events[i].tokenType === TokenType.ERC721 ||
        events[i].tokenType === TokenType.ERC1155
      ) {
        finalEvent = events[i];
        break;
      } else if (events[i].tokenType === TokenType.ERC20) {
        finalEvent = events[i];
        break;
      }
    }
  }

  if (finalEvent && finalEvent.type === EventType.Approval) {
    if (
      finalEvent.tokenType === TokenType.ERC721 ||
      finalEvent.tokenType === TokenType.ERC1155
    ) {
      return RemovalTokenMessage(`Approving NFT From Wallet`, "bg-maroon");
    } else if (finalEvent.tokenType === TokenType.ERC20) {
      return RemovalTokenMessage(`Approving Tokens From Wallet`, "bg-maroon");
    }
  }

  // handling Token Transfer Out 
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === EventType.TransferOut) {
      if (events[i].symbol === 'ETH') {
        finalEvent = events[i];
        break;
      } else if (
        events[i].tokenType === TokenType.ERC721 ||
        events[i].tokenType === TokenType.ERC1155
      ) {
        finalEvent = events[i];
        break;
      } else if (events[i].tokenType === TokenType.ERC20) {
        finalEvent = events[i];
        break;
      }
    }
  }

  if (finalEvent) {
    if (finalEvent.tokenType === TokenType.ERC20 && finalEvent.symbol !== "ETH") {
      return RemovalTokenMessage(`Removing Tokens From Wallet`, "bg-myyellow");
    }
    else if (finalEvent.symbol === 'ETH') {
      return RemovalTokenMessage(`Removing ETH From Wallet`, "bg-myyellow");
    } else if (
      finalEvent.tokenType === TokenType.ERC721 ||
      finalEvent.tokenType === TokenType.ERC1155
    ) {
      return RemovalTokenMessage(`Removing NFT From Wallet`, "bg-myyellow");
    }
  }



  // ApprovalForAll only can have 1 event.
  if (events.length !== 1) {
    return NoApprovalForAll;
  }

  const event = events[0];

  if (event.type === EventType.ApprovalForAll) {
    // if (event.toAddress && VERIFIED_CONTRACTS.has(event.toAddress)) {
    //   // Set ApprovalForAll but keep going.
    //   return (
    //     <div>
    //       <div className="flex flex-row text-base justify-center text-gray-100 text-center pb-2">
    //         <div>
    //           Giving approval to {VERIFIED_CONTRACTS.get(event.toAddress)}
    //         </div>
    //         <div className="my-auto pl-1 text-green-300">
    //           <MdVerified />
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }

    return (
      <div className="flex gap-x-2 relative p-2 bg-maroon justify-center">
        <div className="flex flex-row justify-center">
          <img
            className="m-auto item-center"
            src={'warningsign.png'}
            alt="token"
            width="48"
            height="48"
          />
          <div className="flex flex-col item-center">
            <div className="text-lg text-white m-auto ml-2 font-bold uppercase">
              NFTs In Danger
            </div>
            <div className="text-sm text-white m-auto ml-2">
              continue if you trust the website
            </div>
          </div>
        </div>
      </div>
    );
  }
  return NoApprovalForAll;
};

const SimulationComponent = ({ simulation }) => {
  const simulationEvents = () => {
    if (simulation.events.length === 0) {
      return (
        <div className="flex flex-col p-1 gap-4 text-center text-xl w-full">
          No changes in assets found!
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 w-full">
        {simulation.events.map((event, index) => {
          return <EventComponent key={`${index}`} event={event} />;
          // return <div>hello</div>
        })}
      </div>
    );
  };

  return <div className="self-start w-full">{simulationEvents()}</div>;
};

const ConfirmSimulationButton = ({
  id,
  state,
  seconds
}) => {
  if (simulationNeedsAction(state)) {
    let okButtonClassName = "bg-gray-500";
    if (seconds === 0) {
      okButtonClassName = "bg-white hover:bg-blue-100";
    }

    // disabling button until the three seconds timer is not finished
    return (
      <div className="flex flex-row space-x-16 p-4 justify-center">
        <button
          className={`text-base ${okButtonClassName}  text-black w-28 py-2 rounded-full`}
          onClick={() => {
            updateSimulationState(id, StoredSimulationState.Rejected);
          }}
          disabled={seconds !== 0 ? true : false}
        >
          OK
        </button>

      </div>
    );
  }
  return null;
};

// todo change loader in code
const StoredSimulationComponent = ({
  storedSimulation,
  seconds
}) => {
  if (storedSimulation.state === StoredSimulationState.Simulating) {
    return (
      // TODO loading image
      <div className="flex flex-col grow justify-center items-center w-full">
        {/* <img className="w-24" src="transparentbg.png" alt="signAssist" /> */}
        <div className="flex flex-col justify-center items-center">
          {/* <Audio color="#00BFFF" height={80} width={80}/> */}
          <ContentLoader
            width={400}
            height={40}
            backgroundColor="#ababab"
            foregroundColor="#fafafa"
          >
            <rect x="70" y="15" rx="5" ry="5" width="300" height="15" />
            <rect x="70" y="39" rx="5" ry="5" width="220" height="9" />
            <rect x="20" y="10" rx="0" ry="0" width="40" height="40" />
          </ContentLoader>
          <ContentLoader
            width={400}
            height={40}
            backgroundColor="#ababab"
            foregroundColor="#fafafa"
          >
            <rect x="70" y="15" rx="5" ry="5" width="300" height="15" />
            <rect x="70" y="39" rx="5" ry="5" width="220" height="9" />
            <rect x="20" y="10" rx="0" ry="0" width="40" height="40" />
          </ContentLoader>
          <ContentLoader
            width={400}
            height={40}
            backgroundColor="#ababab"
            foregroundColor="#fafafa"
          >
            <rect x="70" y="15" rx="5" ry="5" width="300" height="15" />
            <rect x="70" y="39" rx="5" ry="5" width="220" height="9" />
            <rect x="20" y="10" rx="0" ry="0" width="40" height="40" />
          </ContentLoader>
          {seconds !== 0 && <div className="text-white text-lg pt-2">Simulating...</div>}
          {seconds === 0 && <div className="text-white text-sm pt-2 text-center">Please Wait <p>Simulation Taking Longer Time than Usual</p></div>}
        </div>
      </div>
    );
  }

  if (storedSimulation.state === StoredSimulationState.Revert) {
    return (
      // TODO Failed image
      <div className="flex flex-col grow justify-center items-center w-11/12">
        <img className="w-48" src="transparentbg.png" alt="failed" />
        <div className="text-gray-300 text-center text-base p-2">
          <div>
            Simulation shows the transaction will fail
            {storedSimulation.error &&
              ` with message ${JSON.stringify(
                storedSimulation.error,
                null,
                2
              )}.`}
          </div>
        </div>
      </div>
    );
  }

  if (storedSimulation.state === StoredSimulationState.Error) {
    return (
      // TODO Transaction Errored image
      <div className="flex flex-col grow justify-center items-center w-11/12">
        <img className="w-32" src="transparentbg.png" alt="failure" />
        <div className="text-gray-300 text-center text-base p-2">
          <div>
            Simulation faced some issue{' '}
            {storedSimulation.error &&
              `with message ${JSON.stringify(
                storedSimulation.error,
                null,
                2
              )}.`}
          </div>

          {/* <div>
            contact team for support with this (id: {storedSimulation.id}).
          </div> */}
        </div>
      </div>
    );
  }

  // Re-hydrate the functions.
  const simulation = Simulation.fromJSON(storedSimulation.simulation);

  if (storedSimulation.state === StoredSimulationState.Success) {
    return (
      <div className="flex flex-col grow items-center justify-center w-full">
        <div className="m-2 w-full">
          <TransferAllWarning events={simulation.events} />
        </div>
        <div className="flex flex-col grow items-center justify-center w-full">
          <div className="m-2 border-y border-gray-600 w-full">
            <SimulationComponent simulation={simulation} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

const SimulationUIComponent = () => {
  const [storedSimulations] = useChromeStorageSync(STORAGE_KEY, []);



  const [seconds, setSeconds] = useState(3);
  useEffect(() => {
    let myInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      }
      if (seconds === 0) {
        clearInterval(myInterval)
      }
    }, 1000)
    return () => {
      clearInterval(myInterval);
    };
  });

  const filteredSimulations = storedSimulations?.filter(
    (simulation) =>
      simulation.state !== StoredSimulationState.Rejected &&
      simulation.state !== StoredSimulationState.Confirmed
  );

  if (!filteredSimulations || filteredSimulations.length === 0) {
    return (
      <div className="flex flex-col">
        <div>
          <img
            className="w-screen border-t border-gray-600"
            // src="waves_top.png "
            alt=""
          />
        </div>
        <div className="flex grow justify-center items-center">
          <NoTransactionComponent />
        </div>
        <div>
          <img className="mt-auto w-screen"
            //  src="waves_bottom.png" 
            alt="" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between w-full">
      {filteredSimulations.length !== 1 && (
        <div className="p-2 text-base flex items-center justify-center text-gray-400 border-t border-gray-600 w-full">
          {filteredSimulations.length} transactions queued
        </div>
      )}
      <img
        className="w-screen border-t border-gray-600"
        // src="waves_top.png"
        alt=""
      />
      <div className="flex flex-col grow w-full justify-center items-center">
        <StoredSimulationComponent
          key={filteredSimulations[0].id}
          storedSimulation={filteredSimulations[0]}
          seconds={seconds}
        />
        <img
          className="mt-auto w-screen"
          // src="waves_bottom.png"
          alt=""
        />
        <div className="mt-auto border-t border-gray-600 w-full">
          <ConfirmSimulationButton
            id={filteredSimulations[0].id}
            state={filteredSimulations[0].state}
            seconds={seconds}
          />
        </div>
      </div>
    </div>
  );
};

export default SimulationUIComponent;
