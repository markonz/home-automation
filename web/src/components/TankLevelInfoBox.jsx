import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as utils from '../utils.js';

import './InfoBoxCommon.css';
import './TankLevelInfoBox.css';

//var measTypes = require('./measurementDefs.json');

class TankLevelInfoBox extends Component {
  constructor(props) {
    super(props);
  }

  updateDataAge() {
    this.setState( { dataAge: utils.formatDataAge(this.props.data.measTime)});
  }

  componentWillMount() {
    this.updateDataAge();
  }

  componentDidMount() {
    this.timer = setInterval( () => {
      this.updateDataAge();
    }, 60 * 1000);
  }

  render() {
    return (
      <div
        className="TankLevelInfoBox"
      >
        <div className="StatusHeader">
          {this.props.data.sensorType}
          <div className="SensorRssi">
            {this.props.data.rssi}
          </div>
        </div>
        
        <div className="StatusValue centerVertical" >
          {this.props.data.fillLevel} %
          <div className="StatusAttrib left">
            {this.props.data.distance} cm  / {this.props.data.signalLevel}
          </div>
        </div>

        <div
          className="StatusFooter"
          >
        <div className="left">
          {this.props.data.sensorBattery} mV<br />
          {this.props.data.extBattery} mV
        </div>
        <div className="right">
          {this.state.dataAge}<br />
          {this.props.data.temperature} C
          </div>
        </div>
      </div>
    );
  }
}
/*
*/

export default TankLevelInfoBox;
