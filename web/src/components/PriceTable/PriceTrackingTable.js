import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import financeService from '../../services/FinanceService';

const PriceTrackingTable = () => {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const updateTableData = () => {
      const data = financeService.getData();
      
      if (data.length > 1) {
        // Get only the most recent 15 entries
        const recentData = [...data].slice(-15).reverse();
        
        // Process the data to add price change information
        const processedData = recentData.map((entry, index) => {
          let priceChange = null;
          let priceChangePct = null;
          
          // Calculate change from previous entry (next in the reversed array)
          if (index < recentData.length - 1) {
            priceChange = entry.spy_price - recentData[index + 1].spy_price;
            priceChangePct = (priceChange / recentData[index + 1].spy_price) * 100;
          }
          
          return {
            ...entry,
            priceChange,
            priceChangePct
          };
        });
        
        setTableData(processedData);
      }
    };
    
    // Update initially
    updateTableData();
    
    // Set up interval to update table every second
    const intervalId = setInterval(updateTableData, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format number as currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '--';
    return `$${value.toFixed(2)}`;
  };
  
  // Format difference and change with more precision
  const formatPreciseValue = (value) => {
    if (value === null || value === undefined) return '--';
    return `$${value.toFixed(4)}`;
  };
  
  // Format percent
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '--';
    return `${value.toFixed(4)}%`;
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };
  
  // Get CSS class for positive/negative values
  const getValueClass = (value) => {
    if (value === null || value === undefined) return '';
    return value > 0 ? 'text-success bg-success-subtle' : 
           value < 0 ? 'text-danger bg-danger-subtle' : '';
  };

  return (
    <div className="price-table-container my-4">
      <div className="card shadow">
        <div className="card-header">
          <h5 className="mb-0">💹 Real-Time Price Tracking</h5>
        </div>
        <div className="card-body">
          <p className="card-text">Track the most recent price changes and NAV differences in real-time:</p>
          
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>SPY Price</th>
                  <th>Previous Price</th>
                  <th>Change</th>
                  <th>Change %</th>
                  <th>NAV Value</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td>{formatTime(row.timestamp)}</td>
                    <td>{formatCurrency(row.spy_price)}</td>
                    <td>
                      {index < tableData.length - 1 ? 
                        formatCurrency(tableData[index + 1]?.spy_price) : '--'}
                    </td>
                    <td className={getValueClass(row.priceChange)}>
                      {formatPreciseValue(row.priceChange)}
                    </td>
                    <td className={getValueClass(row.priceChangePct)}>
                      {formatPercent(row.priceChangePct)}
                    </td>
                    <td>{formatCurrency(row.nav_value)}</td>
                    <td className={getValueClass(row.difference)}>
                      {formatPreciseValue(row.difference)}
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">Waiting for data...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <p className="text-muted mt-2">
            Last updated: {tableData.length > 0 ? 
              format(new Date(tableData[0].timestamp), 'yyyy-MM-dd HH:mm:ss') : '--'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceTrackingTable;
