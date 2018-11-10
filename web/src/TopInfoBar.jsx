import React, { Component } from 'react';
import PropTypes from 'prop-types';

import * as firebase from 'firebase';

import './TopInfoBar.css';

class TopInfoBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  handleGatewayUpdate(snapshot) {
    let gwList = [];

    snapshot.docs.map( function(gw) {
      gwList.push(gw.data());
    });

    this.setState({
      gateways: gwList
      });
  }

  setGatewayListener() {
    firebase.firestore().collection('gateways')
      .orderBy('ipAddress', 'asc')
      .onSnapshot( (snapshot) => this.handleGatewayUpdate(snapshot)
      );
  }

  componentWillMount() {
    this.setGatewayListener();
  }

  createTable(gateways) {
    let table = []

    if(gateways) {
      gateways.map( function(gw, i) {
        let row = [];

        row.key = i;
        row.push(<td key="1">{gw.name}</td>);
        row.push(<td key="2">{gw.ipAddress}</td>);

        table.push(<tr key={i}>{row}</tr>);
      });

    }

    return table
  }
  
  render() {
    return (
      <header className="App-header">
        <table className="Gateway-IP"><tbody>
          {this.createTable(this.state.gateways)}
        </tbody></table>
      </header>
  );
  }
}

export default TopInfoBar;
