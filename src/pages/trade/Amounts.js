import React from 'react';
import { bnt } from '../../utils/bn';
import { OutletContext } from '../Layout';

const PRECISION = 5;

export default class Amounts extends React.Component {

    static contextType = OutletContext;

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const { swapInfo } = this.props;
        const tokens = swapInfo?.tokens;
        const priceInfo = swapInfo?.priceInfo;
        return ( 
            <>
              {bnt(priceInfo?.amounts?.amountIn, PRECISION)} {tokens?.tokenIn?.symbol} 
              <i className="bi bi-arrow-right mx-3"></i> 
              {bnt(priceInfo?.amounts?.amountOut, PRECISION)} {tokens?.tokenOut?.symbol}
            </>
          );
    }
}