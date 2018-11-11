import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as firebase from 'firebase';

import TankLevelInfoBox from './components/TankLevelInfoBox';
import Graph from './Graph';

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

  setGraphDataListener() {
    this.timer = setInterval( () => {
      this.updateGraph();
    }, 3600 * 60 * 1000);
  }

  updateGraph() {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    console.log("startDate", startDate);
    firebase.firestore().collection('tankLevelReadings')
        .where('measTime', '>', startDate)
        .orderBy('measTime', 'desc')
        .get()
        .then((snapshot) => {
            var plotData = [];
            var gdata = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                let strTimestamp = data.measTime.toDate().getTime();
                var point = {
                    x: strTimestamp,
                    y: data.FillPercentage
                };
                
                gdata.push(point);
            });

            plotData.push(gdata);
            
  //                console.log(gdata);
  //                console.log(snapshot);
            this.setState({
                graphData: plotData
            });
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
    this.updateGraph();
    this.setGraphDataListener();
  }

  render() {
    if(!this.state.infoboxData || !this.state.graphData) {
      return(null)
    }

    return (
      <div className="sensorReading" >
        <TankLevelInfoBox data={this.state.infoboxData} />
        <Graph data={this.state.graphData} />
      </div>
      );
  }
}

export default TankLevelReading;
