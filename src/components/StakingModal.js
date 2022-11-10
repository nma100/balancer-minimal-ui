import React from 'react';
import { OutletContext } from '../pages/Layout';
import { formatUnits } from 'ethers/lib/utils';
import { constants } from 'ethers';
export const STAKING_MODAL = "staking-modal";

export const Mode = {
    Init: 'init',
    Approval: 'approval',
    Stake: 'stake',
}

export class StakingModal extends React.Component {

    static contextType = OutletContext;
   
    constructor(props) {
        super(props);
        this.state = { mode: 'init' };
    }

    componentDidMount() {
        //console.log("componentDidMount StakingModal", this.props.pool?.name);
        
        document
            .getElementById(STAKING_MODAL)
            .addEventListener('show.bs.modal', this.init.bind(this));
    }

    async init() {

        /* Deux états : 
            - Need approve
            - Stake ready

            Détermination si Need approve :
            Récup gauge address
            Interrogation Pool Token, voir si gauge autorisée à transferer token de user
        */
        // https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#IERC20-allowance-address-address-

        console.log('INIT ==');

        const { account, balancer, web3Provider } = this.context;
        
        const poolId = document.getElementById(STAKING_MODAL).dataset.poolId;
        console.log(`pool to stake`, poolId);

        const pool = await balancer.findPool(poolId);
        const gauge = await balancer.findPreferentialGauge(pool);

        const poolERC20 = balancer.ERC20(pool.address, web3Provider);
        
        console.log("pool addr", pool.address);
        console.log("pref gauge", gauge);
        console.log("account", account);


        const balance = await poolERC20.balanceOf(account);
        console.log('User balance before :', formatUnits(balance, 0));

        const allowance = await poolERC20.allowance(account, gauge);
        console.log('allowance :', formatUnits(allowance, 0));

        const isApproved = allowance.gt(constants.Zero);
        console.log('isApproved :', isApproved);

        this.setState({ 
            pool:pool, 
            mode: isApproved ?  'stake' : 'approval' 
        });
    }

    handleApprove() {
        console.log('Handle Approve !');
    }

    handleStake() {
        console.log('Handle Stake !');
    }

    render() {
        const { mode, pool } = this.state;   
        const { theme } = this.context;
        const isDark = (theme === 'dark');
        const contentClass = isDark ? "bg-dark text-light" : "bg-light text-dark";

        return (
            <div id={STAKING_MODAL} className="modal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-header">
                    <h5 className="modal-title">Stake LP tokens</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <p>{ pool?.name }</p>
                        <p>{ pool?.bpt }</p>
                        {mode === 'init' &&
                            <>
                                Wait ...
                            </>
                        }
                        {mode === 'approval' &&
                            <>
                                <button type="button" className="btn btn-secondary" onClick={e => this.handleApprove(e)}>Approve BPT</button>
                            </>
                        }
                        {mode === 'stake' &&
                            <>
                                <button type="button" className="btn btn-secondary"  onClick={e => this.handleStake(e)}>Stake</button>
                            </>
                        }
                    </div>
                </div>
                </div>
            </div>
        );
    }
}