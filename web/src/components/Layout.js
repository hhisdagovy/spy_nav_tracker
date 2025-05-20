import React from 'react';
import PriceMetrics from './PriceMetrics';
import SPYvsNAVChart from './Charts/SPYvsNAVChart';
import PriceTrackingTable from './PriceTable/PriceTrackingTable';
import InfoSidebar from './Sidebar/InfoSidebar';

const Layout = () => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-9">
          {/* Main Content Area */}
          <div className="content-container">
            <h1 className="display-5 mb-3">📊 SPY ETF vs NAV Real-time Tracker</h1>
            <p className="lead">
              This application displays the real-time difference between SPY ETF price and its Net Asset Value (NAV).
              Data updates every second to provide the latest comparison.
            </p>
            
            {/* Price Metrics */}
            <PriceMetrics />
            
            {/* Charts */}
            <SPYvsNAVChart />
            
            {/* Price Tracking Table */}
            <PriceTrackingTable />
          </div>
        </div>
        
        <div className="col-md-3">
          {/* Sidebar */}
          <InfoSidebar />
        </div>
      </div>
      
      <footer className="footer mt-5 text-center">
        <p className="text-muted">
          SPY ETF vs NAV Tracker &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Layout;
