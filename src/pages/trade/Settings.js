import React from 'react';
import { isDark } from '../../theme';
import { hideModal } from '../../utils/page';
import { OutletContext } from '../Layout';
export const SETTINGS_MODAL = 'settings';

export class Settings extends React.Component {
      
  static contextType = OutletContext;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() { 
    const modal = document.getElementById(SETTINGS_MODAL);
    modal.addEventListener('show.bs.modal', this.onShow.bind(this));
  }
  
  async onShow() {
    console.log('Settings on show')
  }

  async handleSave() {
    console.log('Settings save')
    hideModal(SETTINGS_MODAL);
  }

  css() {
    const { theme } = this.context;
    const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
    return { contentClass };
  }

  render() {
    const { contentClass } = this.css();
    return ( 
      <>
        <div id={SETTINGS_MODAL} className="modal" tabIndex="-1">
            <div className="modal-dialog modal-sm modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-body">
                        <h3>Settings</h3>
                        <p>TODO ...</p>
                        <button type="button" className="btn btn-secondary" onClick={() => this.handleSave()}>
                          Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </>
    );
  }
}
