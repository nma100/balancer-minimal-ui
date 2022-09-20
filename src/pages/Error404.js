import React from 'react';

class Error404 extends React.Component {
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

export default Error404;