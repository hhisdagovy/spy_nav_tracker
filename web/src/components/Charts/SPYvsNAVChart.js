import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import financeService from '../../services/FinanceService';

const SPYvsNAVChart = () => {
  const [chartData, setChartData] = useState({
    timestamps: [],
    spyPrices: [],
    navValues: [],
    differences: []
  });

  // Update chart data whenever the finance service data changes
  useEffect(() => {
    const updateChartData = () => {
      const data = financeService.getData();
      
      // Format data for charts
      const timestamps = data.map(d => d.timestamp);
      const spyPrices = data.map(d => d.spy_price);
      const navValues = data.map(d => d.nav_value);
      const differences = data.map(d => d.difference);
      
      setChartData({
        timestamps,
        spyPrices,
        navValues,
        differences
      });
    };
    
    // Update initially
    updateChartData();
    
    // Set up interval to update chart every second
    const intervalId = setInterval(updateChartData, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="chart-container my-4">
      <div className="card shadow">
        <div className="card-body">
          <Plot
            data={[
              // SPY Price trace
              {
                x: chartData.timestamps,
                y: chartData.spyPrices,
                type: 'scatter',
                mode: 'lines',
                name: 'SPY Price',
                line: { color: '#1f77b4', width: 2 }
              },
              // NAV Value trace
              {
                x: chartData.timestamps,
                y: chartData.navValues,
                type: 'scatter',
                mode: 'lines',
                name: 'NAV Value',
                line: { color: '#ff7f0e', width: 2 }
              }
            ]}
            layout={{
              title: 'SPY Price vs NAV',
              autosize: true,
              height: 400,
              margin: { l: 50, r: 50, t: 50, b: 50 },
              xaxis: {
                title: 'Time'
              },
              yaxis: {
                title: 'Price ($)'
              },
              template: 'plotly_white',
              legend: {
                orientation: 'h',
                y: 1.1
              }
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>
      
      <div className="card shadow mt-4">
        <div className="card-body">
          <Plot
            data={[
              // Difference trace
              {
                x: chartData.timestamps,
                y: chartData.differences,
                type: 'scatter',
                mode: 'lines',
                name: 'Price-NAV Difference',
                line: { color: '#2ca02c', width: 2 },
                fill: 'tozeroy'
              }
            ]}
            layout={{
              title: 'Price-NAV Difference',
              autosize: true,
              height: 300,
              margin: { l: 50, r: 50, t: 50, b: 50 },
              xaxis: {
                title: 'Time'
              },
              yaxis: {
                title: 'Difference ($)',
                zeroline: true,
                zerolinecolor: 'red',
                zerolinewidth: 2
              },
              template: 'plotly_white'
            }}
            style={{ width: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SPYvsNAVChart;
