import React from 'react';
import { isDark } from '../../theme';
import { getLeafTokens } from '../../utils/pool';
import { OutletContext } from '../Layout';

export const JOIN_POOL_MODAL = 'join-pool';

export class JoinPool extends React.Component {
      
    static contextType = OutletContext;
  
    constructor(props) {
      super(props);
      this.state = {};
    }
    
    css() {
        const { theme } = this.context;
        const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-white text-dark';
        const btnClass = isDark(theme) ? 'btn btn-secondary' : 'btn btn-light border shadow-sm';
        return { contentClass, btnClass };
    }

    render() {
        const { contentClass} = this.css();
        console.log('Pool', this.props?.pool);
        const leafTokens = getLeafTokens(this.props?.pool);
        console.log('teaf tab', leafTokens);
        return (
            <div id={JOIN_POOL_MODAL} className="modal" tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className={`modal-content ${contentClass}`}>
                        <div className="modal-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="fs-1">Deposit</div>
                                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            {leafTokens?.map(token => token.symbol).sort().map(token =>
                                <div>{token}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}