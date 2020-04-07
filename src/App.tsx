import React from 'react';
import './App.css';
import { InteractiveMapConnected } from './components/map-components/InteractiveMap/InteractiveMap';
import { TerritoryPanelConnected } from './components/edition-components/TerritoryPanel/TerritoryPanel';
import { EditionPopupConnected } from './components/edition-components/EditionPopup/EditionPopup';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
  useParams
} from "react-router-dom";
import { VideoPlayer } from './components/video-components/video-player/VideoPlayer';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <div>
            <section id="main-map">
              <InteractiveMapConnected></InteractiveMapConnected>
            </section>
            <section id="territory-panel-section">
              <TerritoryPanelConnected />
            </section>
            <section id="editing-panel-section">
              <EditionPopupConnected />
            </section>
            <section>

            </section>
          </div>
        </Route>
        <Route path="/movie/:state_id">
          <VideoPage />
        </Route>


      </Switch>
    </Router>
  );
};

const VideoPage: React.FC = () => {
  const { state_id } = useParams<{ state_id: string }>();
  return (
    <div className="container-fluid">
      <div className="row d-flex justify-content-center video-page">
        <div className="col-12  col-lg-11 col-xl-10 p-0">
          <VideoPlayer stateId={parseInt(state_id, 10)} />
        </div>
      </div>
    </div>
  );
};

export default App;
