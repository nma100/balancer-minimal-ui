import React from 'react';
import { OutletContext } from '../pages/Layout';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { constants } from 'ethers';

export const STAKING_MODAL = "staking-modal";

export const Mode = {
    Init: 'init',
    Approval: 'approval',
    Stake: 'stake',
    Deposited : 'deposited'
}

export class StakingModal extends React.Component {

    static contextType = OutletContext;
   
    constructor(props) {
        super(props);
        this.state = { mode: Mode.Init };
    }

    componentDidMount() {
        document
            .getElementById(STAKING_MODAL)
            .addEventListener('show.bs.modal', this.init.bind(this));
    }

    async init() {
        
        const { account, balancer, web3Provider } = this.context;
        
        const modal = document.getElementById(STAKING_MODAL);

        const { poolName, poolAddress, poolBpt, poolShares } = modal.dataset;

        console.log(`poolName`, poolName);
        console.log(`poolAddress`, poolAddress);
        console.log(`poolBpt`, parseUnits(poolBpt).toString());
        console.log(`poolShares`, poolShares);

        const userPoolBpt = parseUnits(poolBpt);
        const userPoolShares = parseFloat(poolShares)

        this.setState({ 
            poolName: poolName, 
            poolAddress: poolAddress, 
            poolBpt: userPoolBpt, 
            poolShares: userPoolShares,
         });

        const gauge = await balancer.findPreferentialGauge(poolAddress);

        const poolERC20 = balancer.ERC20(poolAddress, web3Provider);
        
        console.log("pref gauge", gauge);
        console.log("account", account);

        const balance = await poolERC20.balanceOf(account);
        console.log('User balance :', formatUnits(balance, 0));

        const allowance = await poolERC20.allowance(account, gauge);
        console.log('allowance :', formatUnits(allowance, 0));

        const isApproved = allowance.gte(userPoolBpt);
        console.log('isApproved :', isApproved);

        const mode = isApproved ?  Mode.Stake : Mode.Approval;

        this.setState({ gauge: gauge, mode: mode });
    }

    async handleApprove() {
        console.log('Handle Approve !');

        const { account, balancer, web3Provider } = this.context;
        const { poolAddress, gauge } = this.state;

        const poolERC20 = balancer.ERC20(poolAddress, web3Provider.getSigner());
        
        let allowance = await poolERC20.allowance(account, gauge);
        console.log('allowance before:', formatUnits(allowance, 0));

        const tx = await poolERC20.approve(gauge, constants.MaxUint256);
        await tx.wait();

        allowance = await poolERC20.allowance(account, gauge);
        console.log('allowance after:', formatUnits(allowance, 0));

        this.setState({ mode: Mode.Stake });
    }

    async handleStake() {
        console.log('Handle Stake !');

        const { account, balancer, web3Provider } = this.context;
        const { gauge, poolBpt } = this.state;

        const contract = balancer.liquidityGauge(gauge, web3Provider.getSigner());

        let balance = await contract.balanceOf(account);
        console.log('User balance before :', formatUnits(balance, 0));
    
        console.log('Deposing bpt in gauge. Wait ...');
        const tx = await contract.functions['deposit(uint256)'](poolBpt);
        await tx.wait();
    
        balance = await contract.balanceOf(account);
        console.log('User balance after :', formatUnits(balance, 0));

        this.setState({ mode: Mode.Deposited });
    }
    
    handleClose() {
        window.location.reload();
    }

    render() {
        const { poolName, poolShares, mode } = this.state;   
        const { theme } = this.context;
        const isDark = (theme === 'dark');
        const contentClass = isDark ? "bg-dark text-light" : "bg-light text-dark";
        const format = n => `$${n ? n.toFixed(2) : "00.00"}`
        return (
            <div id={STAKING_MODAL} className="modal" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                <div className={`modal-content ${contentClass}`}>
                    <div className="modal-header">
                    <h5 className="modal-title">Stake LP tokens</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <p>{ poolName }</p>
                        <p>Value to stake : { format(poolShares) }</p>
                        {mode === Mode.Init &&
                            <>
                                <button type="button" className="btn btn-secondary">Wait ...</button>
                            </>
                        }
                        {mode === Mode.Approval &&
                            <>
                                <button type="button" className="btn btn-secondary" onClick={e => this.handleApprove(e)}>Approve BPT</button>
                            </>
                        }
                        {mode === Mode.Stake &&
                            <>
                                <button type="button" className="btn btn-secondary"  onClick={e => this.handleStake(e)}>Stake</button>
                            </>
                        }
                        {mode === Mode.Deposited &&
                            <>
                                <p>Success !</p>
                                <button type="button" className="btn btn-secondary"  onClick={e => this.handleClose(e)}>Close</button>
                            </>
                        }
                    </div>
                </div>
                </div>
            </div>
        );
    }
}