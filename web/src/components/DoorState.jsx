import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as firebase from 'firebase';

import DoorStateDisplay from './DoorStateDisplay';

import './DoorState.css';

class DoorState extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
    };
  }

  setStatusListener() {
    firebase.firestore().collection('measurements')
    .where('measType', '==', 3)
    .where('sensorLocation', '==', parseInt(this.props.sensorLocation))
      .orderBy('measTime', 'desc')
      .limit(1)
      .onSnapshot( (snapshot) => {
        console.log(snapshot);
        const latestUpdate = snapshot.docs[0].data();

        const data = {
          latestValue: latestUpdate.value,
          sensorBattery: latestUpdate.sensorBattery,
          measTime: latestUpdate.measTime.toDate(),
          sensorMac: latestUpdate.sensorMac,
          rssi: latestUpdate.sensorRssi,
          location: this.props.sensorTitle
        };
        this.setState({
          infoboxData: data
          });
      });
  }

  componentWillMount() {
    this.setStatusListener();
  }

  componentDidMount() {
  }

  render() {
    if(!this.state.infoboxData) {
      return(null)
    }

    return (
      <div className="doorState" >
        <DoorStateDisplay data={this.state.infoboxData} />
      </div>
      );
  }
}
/*
*/

export default DoorState;
