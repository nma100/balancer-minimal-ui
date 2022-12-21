import React from 'react';
import { isDark } from '../../theme';
import { OutletContext } from '../Layout';

export const PREVIEW_MODAL = 'preview';

export class Preview extends React.Component {

  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const modal = document.getElementById(PREVIEW_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
    modal.addEventListener('hide.bs.modal', this.onHide.bind(this));
  }
  
  onShow() {
  }

  onHide() {
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  render() {
    const { contentClass } = this.css();
    const { swapInfo } = this.props;
    if (swapInfo) {
      console.log('swapInfo', swapInfo);
    }
    return ( 
      <div id={PREVIEW_MODAL} className="modal" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
              <div className={`modal-content ${contentClass}`}>
                  <div className="modal-body">
                    <p>In : </p>
                    <p>Out : </p>
                    <p className="small">Price impact : </p>
                    <p className="small">Max Slippage : </p>
                  </div>
              </div>
          </div>
      </div>
    );
  }
}
