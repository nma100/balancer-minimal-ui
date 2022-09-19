import React from 'react';

class NoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  render() {
    return (
      <div>
        <p>404 Error</p>  
      </div>
    );
  }
}

export default NoPage;