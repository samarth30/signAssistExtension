import React, { useEffect } from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/SimulationUI/Simulation';
// import '../../assets/styles/tailwind.css';
import Simulation from '../../containers/SimulationUI/Simulation';

const Popup = () => {

  useEffect(() => {
    document.title = 'Sign Assist';
    chrome.storage.sync.get('first_open', (result) => {
      if (Object.keys(result).length === 0) {
        // mixpanel.track('First Open');
        chrome.storage.sync.set({ first_open: true });
      }
    });
  }, []);
  return (
    <div className="flex flex-row justify-center min-h-[100vh] lg:pb-96">
      <div className="flex flex-col text-white  overflow-hidden min-w-[360px] w-full lg:w-1/5   items-center border border-black" style={{ backgroundColor: "#1d2443" }}>

        <div className="flex flex-row p-5 text-center">
          <h3 className="flex flex-row gap-4 text-xl leading-6 font-medium text-white">
            <img src="transparentbg.png" className="h-8 my-auto" alt="logo" />
            <div className="font-light text-xl my-auto">Sign Assist</div>
          </h3>
        </div>
        <div className="flex grow">
          <Simulation />
        </div>

      </div>
    </div>
  );
};

export default Popup;
