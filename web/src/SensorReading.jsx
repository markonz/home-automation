import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as firebase from 'firebase';

import StatusInfoBox from './components/StatusInfoBox';
import Graph from './Graph';

import './SensorReading.css';

class SensorReading extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
    };
  }

  getSensorTypeText(type) {
    switch(type) {
      case 1:   return("LÄMPÖTILA");
      default: return("TYPE " + type);
    }
  }

  setStatusListener() {
    firebase.firestore().collection('measurements')
    .where('measType', '==', parseInt(this.props.sensorType))
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
          sensorType: this.props.sensorTitle
        };
        this.setState({
          infoboxData: data
          });
      });
  }

  setGraphDataListener() {
    this.timer = setInterval( () => {
      this.updateGraph();
    }, 30 * 60 * 1000);
  }

  updateGraph() {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 3);

    console.log("startDate", startDate);
    firebase.firestore().collection('measurements')
        .where('measType', '==', parseInt(this.props.sensorType))
        .where('sensorLocation', '==', parseInt(this.props.sensorLocation))
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
                    y: data.value
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

  setGraphDataListener_x() {
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 3);

    console.log("startDate", startDate);
    firebase.firestore().collection('measurements')
        .where('measType', '==', parseInt(this.props.sensorType))
        .where('sensorLocation', '==', parseInt(this.props.sensorLocation))
        .where('measTime', '>', startDate)
        .orderBy('measTime', 'desc')
        .onSnapshot( (snapshot) => {
          var plotData = [];
            var gdata = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                let strTimestamp = data.measTime.toDate().getTime();
                var point = {
                    x: strTimestamp,
                    y: data.value
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

  componentWillMount() {
    this.setStatusListener();
    this.updateGraph();
    this.setGraphDataListener();
  }

  componentDidMount() {
  }

  render() {
    if(!this.state.infoboxData || !this.state.graphData) {
      return(null)
    }

    return (
      <div className="sensorReading" >
        <StatusInfoBox data={this.state.infoboxData} />
        <Graph data={this.state.graphData} />
      </div>
      );
  }
}
/*
*/

export default SensorReading;
