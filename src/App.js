import React from 'react';
import './App.css';
import Rtc from './components/rtc';
import Game from './components/game';

function App() {
  return (
    <Rtc render={({player, localStream, remoteStream, status, dataChannel}) => (
        <Game
          player={player}
          localStream={localStream}
          remoteStream={remoteStream}
          connectionStatus={status}
          dataChannel={dataChannel}
        />
      )} 
    />
  );
}

export default App;
