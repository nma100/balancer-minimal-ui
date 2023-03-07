import { useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { activeInvest } from "../../utils/page";

export default function ExitPool(props) {

    const { poolId } = useParams();
    console.log('Exit Pool', props);

    useEffect(() => activeInvest());
    
    return (
        <div id="exit-pool" className="row">
            <div className="col-12 col-lg-7 col-xxl-6">
                <div className="bg-dark bg-gradient shadow rounded p-3">

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="fs-1">Withdraw</div>
                        <NavLink className="btn-close btn-close-white" to="/"></NavLink>
                    </div>

                    <div>Exit Pool { poolId }</div>

                </div>
            </div>
        </div>
    );
}