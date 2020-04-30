import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
} from 'react-router-dom';

import './App.css';
import Home from './components/home';
import Rtc from './components/rtc';
import Game from './components/game';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      {/* <div className="cover-container d-flex h-100 p-3 mx-auto flex-column"> */}
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route 
            path="/game/:id"
            render={({ match }) =>
              <>
                <header>
                  <h3 className="masthead-brand">ChessTime</h3>
                </header>
                <main role="main" className="cover">
                  <Rtc match={match} render={({player, localStream, remoteStream, status, dataChannel}) => (
                      <Game
                        player={player}
                        localStream={localStream}
                        remoteStream={remoteStream}
                        connectionStatus={status}
                        dataChannel={dataChannel}
                      />
                    )}
                  />
                </main>
              </>
            }
          />
        </Switch>
      {/* </div> */}
    </Router>
  );
}

export default App;
