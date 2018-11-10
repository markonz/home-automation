import React, { Component } from 'react';
import './App.css';

import TopInfoBar from './TopInfoBar';
import SensorReading from './SensorReading';
import TankLevelReading from './TankLevelReading';
import DoorState from './components/DoorState';

import * as firebase from 'firebase';
import firebaseConfig from './config'

firebase.initializeApp(firebaseConfig);
firebase.firestore().settings({ timestampsInSnapshots: true });

class App extends Component {   

    constructor() {
        super();
    }
    
   componentDidMount() {
    }
  
render() {      
    return (
      <div className="App">
        <TopInfoBar />
        <SensorReading sensorType="1" sensorLocation="1" sensorTitle="ULKOLÄMPÖTILA" />
        <SensorReading sensorType="1" sensorLocation="2" sensorTitle="SISÄLÄMPÖTILA" />
        <TankLevelReading />
        <DoorState sensorLocation="1" sensorTitle="ULKO-OVI" />
        <DoorState sensorLocation="1" sensorTitle="SISÄOVI" />
      </div>
    );
  }
}
/*
*/

export default App;
