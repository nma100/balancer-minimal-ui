import React from 'react';

class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  render() {
    return (
      <div>
        <p>Portfolio</p>
      </div> 
    );
  }
}

export default Portfolio;