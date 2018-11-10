import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {LineChart} from 'react-easy-chart';
               
class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {
        title: 'titel',
        data: props.data
    };
  }

    componentDidMount() {
        this.updateGraph();
    }

    componentDidUpdate() {
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            data: nextProps.data,
        });
    } 

    updateGraph() {
    }

  render() {
    return (
        <div className="graph">
            <LineChart
                xType={'time'}
                tickTimeDisplayFormat={'%d.%m %H:%M'}
                datePattern="%Q"
                axes
                grid                
                verticalGrid
                xTicks={4}
                yTicks={5}
                interpolate={'cardinal'}
                lineColors={['black']}
                width={400}
                height={170}
                data={this.state.data}
            />
        </div>
    );
  }
}

export default Graph;
