import React from 'react';
import { OutletContext } from '../Layout';
import { parseUnits } from 'ethers/lib/utils';
import { constants } from 'ethers';
import { isDark } from '../../theme';

export const STAKING_MODAL = 'staking-bpt-modal';

export const Mode = {
    Init: 'init',
    Approval: 'approval',
    Stake: 'stake',
    Result : 'result'
}

export class StakingModal extends React.Component {

    static contextType = OutletContext;
   
    constructor(props) {
        super(props);
        this.state = { mode: Mode.Init };
    }

    componentDidMount() {
        const modal = document.getElementById(STAKING_MODAL);
        modal.addEventListener('show.bs.modal', this.onShow.bind(this));
        modal.addEventListener('hide.bs.modal', this.onHide.bind(this));
    }

    async onShow() {
        const { account, balancer, web3Provider } = this.context;
        
        const modal = document.getElementById(STAKING_MODAL);

        const { poolName, poolAddress, poolBpt, poolShares } = modal.dataset;

        const userPoolBpt = parseUnits(poolBpt);
        const userPoolShares = parseFloat(poolShares)

        this.setState({ 
            poolName: poolName, 
            poolAddress: poolAddress, 
            poolBpt: userPoolBpt, 
            poolShares: userPoolShares,
         });

        const gauge = await balancer.findPreferentialGauge(poolAddress);

        const allowance = await balancer
            .ERC20(poolAddress, web3Provider)
            .allowance(account, gauge);

        const isBptApproved = allowance.gte(userPoolBpt);

        const mode = isBptApproved ?  Mode.Stake : Mode.Approval;
        this.setState({ gauge: gauge, mode: mode });
    }

    onHide() {
        this.setState({ mode: Mode.Init });
    }

    async handleApprove() {
        const { balancer, web3Provider } = this.context;
        const { poolAddress, gauge } = this.state;

        const tx = await balancer
            .ERC20(poolAddress, web3Provider.getSigner())
            .approve(gauge, constants.MaxUint256);
        
        this.setState({ waiting: true });
        await tx.wait();
        this.setState({ waiting: false, mode: Mode.Stake });
    }

    async handleStake() {
        const { balancer, web3Provider } = this.context;
        const { gauge, poolBpt } = this.state;

        const tx = await balancer
            .liquidityGauge(gauge, web3Provider.getSigner())
            .functions['deposit(uint256)'](poolBpt);

        this.setState({ waiting: true });
        await tx.wait();
        this.setState({ waiting: false, txId: tx.hash , mode: Mode.Result  });
    }
    
    handleClose() {
        window.location.reload();
    }

    css() {
        const { theme } = this.context;

        const contentClass = isDark(theme) ? 'bg-dark text-light' : 'bg-light text-dark';
        const textClass = isDark(theme) ? 'text-white' : 'text-dark';
        const veBalClass = isDark(theme) ? 'veBAL' : 'veBAL-light';

        return { contentClass, textClass, veBalClass };
    }

    render() {
        const { poolName, poolShares, mode, waiting, txId } = this.state;   
        const { contentClass, textClass, veBalClass } = this.css();

        const format = n => `$${n ? n.toFixed(2) : "00.00"}`;

        return (
            <div id={STAKING_MODAL} className="modal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className={`modal-content ${contentClass}`}>
                        <div className="modal-header">
                            <h6 className="modal-title">Stake LP tokens</h6>
                            <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal" aria-label="Close">X</button>
                        </div>
                        <div className="modal-body">
                            <h4 className='mt-2 mb-4 text-break'>{ poolName }</h4>
                            <p className='mb-4'>Value to stake : { format(poolShares) }</p>
                            {mode === Mode.Init &&
                                <>
                                    <button type="button" className="btn btn-secondary  my-1">
                                        Initialisation
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </button>
                                </>
                            }
                            {mode === Mode.Approval &&
                                <>
                                    <button type="button" className="btn btn-secondary my-1" onClick={e => this.handleApprove(e)}>Approve BPT</button>
                                    {waiting && (
                                        <span className="ms-3">Wait please
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </span>
                                    )} 
                                </>
                            }
                            {mode === Mode.Stake &&
                                <>
                                    <button type="button" className="btn btn-secondary my-1" onClick={e => this.handleStake(e)}>Stake</button>
                                    {waiting && (
                                        <span className="ms-3">Wait please
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </span>
                                    )} 
                                </>
                            }
                            {mode === Mode.Result &&
                                <>
                                    <div className={`${veBalClass} mb-3`}>
                                        Successful deposit !
                                    </div>
                                    <p>Transaction : <small className={`${textClass} text-opacity-75 text-break text-muted`}>{txId}</small></p>
                                    <button type="button" className="btn btn-secondary my-1" onClick={e => this.handleClose(e)}>Close</button>
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}