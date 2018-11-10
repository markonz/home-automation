import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as utils from '../utils.js';

import './InfoBoxCommon.css';
import './DoorStateDisplay.css';

class DoorStateDisplay extends Component {
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

  doorStateToClassname(doorState) {
    return("DoorStateDisplay DoorState" + doorState);
  }

  render() {
    return (
      <div
        className={this.doorStateToClassname(this.props.data.latestValue)}
        onClick={this.handleClick}
      >       
        <div
          className="DoorLocation centerVertical"
          >
          {this.props.data.location}
        </div>

        <div
          className="StatusFooter"
          >
        <div className="left">
          {this.props.data.sensorBattery} mV<br />
          {this.props.data.rssi}
        </div>
        <div className="right">{this.state.dataAge}</div>
        </div>
      </div>
    );
  }
}

export default DoorStateDisplay;
