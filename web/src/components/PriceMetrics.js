import React, { useEffect, useState } from 'react';
import financeService from '../services/FinanceService';

const PriceMetrics = () => {
  const [metrics, setMetrics] = useState({
    spyPrice: null,
    navValue: null,
    difference: null,
    percentDifference: null
  });

  useEffect(() => {
    const updateMetrics = () => {
      const latestData = financeService.getLatestData();
      
      if (latestData) {
        const { spy_price, nav_value, difference } = latestData;
        const percentDifference = (difference / nav_value) * 100;
        
        setMetrics({
          spyPrice: spy_price,
          navValue: nav_value,
          difference,
          percentDifference
        });
      }
    };
    
    // Update initially
    updateMetrics();
    
    // Set up interval to update metrics every second
    const intervalId = setInterval(updateMetrics, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format number as currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '--';
    return `$${value.toFixed(2)}`;
  };
  
  // Format difference with more precision
  const formatDifference = (value) => {
    if (value === null || value === undefined) return '--';
    return `$${value.toFixed(4)}`;
  };
  
  // Format percent
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '--';
    return `${value.toFixed(4)}%`;
  };
  
  // Determine color class based on value
  const getDifferenceColorClass = (value) => {
    if (value === null || value === undefined) return '';
    return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : '';
  };

  return (
    <div className="row metrics-container mb-4">
      <div className="col-md-4">
        <div className="card h-100 shadow-sm">
          <div className="card-body text-center">
            <h5 className="card-title">SPY Price</h5>
            <p className="display-5 mb-0 fw-bold">{formatCurrency(metrics.spyPrice)}</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card h-100 shadow-sm">
          <div className="card-body text-center">
            <h5 className="card-title">Estimated NAV</h5>
            <p className="display-5 mb-0 fw-bold">{formatCurrency(metrics.navValue)}</p>
          </div>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card h-100 shadow-sm">
          <div className="card-body text-center">
            <h5 className="card-title">Difference (Price - NAV)</h5>
            <p className={`display-5 mb-0 fw-bold ${getDifferenceColorClass(metrics.difference)}`}>
              {formatDifference(metrics.difference)}
            </p>
            <small className={`${getDifferenceColorClass(metrics.percentDifference)}`}>
              {formatPercent(metrics.percentDifference)}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceMetrics;
