import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Layout from './components/Layout';
import financeService from './services/FinanceService';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial data fetch
    const initializeData = async () => {
      try {
        // Try to fetch initial data
        await financeService.updateData();
        setIsLoading(false);

        // Set up interval to update data every second
        const intervalId = setInterval(async () => {
          await financeService.updateData();
        }, 1000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to fetch financial data. Please try again later.');
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  if (error) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Layout />
    </div>
  );
}

export default App;
