import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as firebase from 'firebase';

import TankLevelInfoBox from './components/TankLevelInfoBox';

class TankLevelReading extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  handleStatusUpdate(latestUpdate) {
    const data = {
      fillLevel: latestUpdate.FillPercentage,
      distance: latestUpdate.distance,
      sensorBattery: latestUpdate.sensorBattery,
      extBattery: latestUpdate.externalBattery,
      signalLevel: latestUpdate.signalLevel,
      temperature: latestUpdate.temperature,
      sensorMac: latestUpdate.sensorMac,
      rssi: latestUpdate.sensorRssi,
      temperature: latestUpdate.temperature,
      measTime: latestUpdate.measTime.toDate(),
      sensorType: "LOKASÄILIÖ"
    };
    this.setState({
      infoboxData: data
      });
}

  setStatusListener() {
    firebase.firestore().collection('tankLevelReadings')
      .orderBy('measTime', 'desc')
      .limit(1)
      .onSnapshot( (snapshot) => this.handleStatusUpdate(snapshot.docs[0].data() )
      );
  }

  componentWillMount() {
    this.setStatusListener();
  }

  render() {
    return (
      this.state.infoboxData ? <TankLevelInfoBox data={this.state.infoboxData} /> : null
    );
  }
}

export default TankLevelReading;
