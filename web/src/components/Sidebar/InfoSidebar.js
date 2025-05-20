import React from 'react';

const InfoSidebar = () => {
  return (
    <div className="sidebar-container">
      <div className="card shadow mb-4">
        <div className="card-header">
          <h5 className="mb-0">About SPY and NAV</h5>
        </div>
        <div className="card-body">
          <p><strong>SPY</strong> is an ETF (Exchange Traded Fund) that tracks the S&P 500 index.</p>
          
          <p><strong>NAV (Net Asset Value)</strong> represents the underlying value of the assets in the fund.</p>
          
          <p><strong>The difference</strong> between SPY's market price and its NAV can indicate:</p>
          <ul>
            <li>Market sentiment</li>
            <li>Arbitrage opportunities</li>
            <li>Liquidity conditions</li>
          </ul>
          
          <p>Data updates every second during market hours.</p>
        </div>
      </div>
      
      <div className="card shadow">
        <div className="card-header">
          <h5 className="mb-0">Data Sources</h5>
        </div>
        <div className="card-body">
          <ul className="list-unstyled">
            <li>SPY price data: Yahoo Finance via yahoo-finance2</li>
            <li>NAV calculation: Approximated based on S&P 500 index value</li>
          </ul>
          
          <button className="btn btn-primary mt-3" onClick={() => window.location.reload()}>
            Force Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoSidebar;
