import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as utils from '../utils.js';

import './InfoBoxCommon.css';
import './StatusInfoBox.css';

class StatusInfoBox extends Component {
  constructor(props) {
    super(props);

    this.state = {      
    };
  }

  handleClick() {
      alert("clieked");
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
        className="StatusInfoBox"
        onClick={this.handleClick}
      >
        <div className="StatusHeader">
          {this.props.data.sensorType}
          <div className="SensorRssi">
            {this.props.data.rssi}
          </div>
        </div>
        
        <div
          className="StatusValue centerVertical"
          >
          {this.props.data.latestValue}
        </div>

        <div
          className="StatusFooter"
          >
        <div className="left">{this.props.data.sensorBattery} mV</div>
        <div className="right">{this.state.dataAge}</div>
        </div>
      </div>
    );
  }
}

export default StatusInfoBox;
