// Mock finance service that simulates data for SPY ETF and NAV values
class FinanceService {
  constructor() {
    this.data = [];
    this.spyBasePrice = 478.50; // Starting price around current SPY value
    this.navBasePrice = 477.80; // Slightly different NAV value
    this.startTime = new Date();
  }

  /**
   * Fetch the latest SPY ETF price (simulated)
   * @returns {Promise<number>} The latest SPY price
   */
  async fetchSPYPrice() {
    try {
      // Add small random movement to price to simulate market activity
      const randomChange = (Math.random() - 0.5) * 0.1;
      this.spyBasePrice = this.spyBasePrice + randomChange;
      return this.spyBasePrice;
    } catch (error) {
      console.error('Error fetching SPY price:', error);
      return null;
    }
  }

  /**
   * Calculate an approximation of SPY's NAV (simulated)
   * @returns {Promise<number>} The approximate NAV value
   */
  async calculateApproxNAV() {
    try {
      // NAV tends to follow SPY but with some variance
      const randomChange = (Math.random() - 0.5) * 0.08;
      this.navBasePrice = this.navBasePrice + randomChange;
      
      // Ensure some relationship with SPY price for realism
      const spyDiff = this.spyBasePrice - this.navBasePrice;
      
      // NAV tends to slowly converge towards SPY price
      if (Math.abs(spyDiff) > 0.5) {
        this.navBasePrice += (spyDiff * 0.01);
      }
      
      return this.navBasePrice;
    } catch (error) {
      console.error('Error calculating approximate NAV:', error);
      return null;
    }
  }

  /**
   * Update data and add new row to the dataframe
   * @returns {Promise<Object>} The latest data point
   */
  async updateData() {
    const currentTime = new Date();
    
    try {
      const spyPrice = await this.fetchSPYPrice();
      const navValue = await this.calculateApproxNAV();
      
      if (spyPrice && navValue) {
        const difference = spyPrice - navValue;
        
        // Create new data point
        const newDataPoint = {
          timestamp: currentTime,
          spy_price: spyPrice,
          nav_value: navValue,
          difference: difference
        };
        
        // Add to existing data
        this.data.push(newDataPoint);
        
        // Keep only the most recent 3600 data points (1 hour at 1-second intervals)
        if (this.data.length > 3600) {
          this.data = this.data.slice(-3600);
        }
        
        return newDataPoint;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating data:', error);
      return null;
    }
  }

  /**
   * Generate initial backfilled data for chart visualization
   * @param {number} points Number of points to generate
   */
  generateInitialData(points = 60) {
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(this.startTime);
      // Use the loop index to set seconds in the past
      timestamp.setSeconds(timestamp.getSeconds() - (points - i));
      
      // Generate slightly different prices for historical data
      const randomSpyChange = (Math.random() - 0.5) * 0.2;
      const randomNavChange = (Math.random() - 0.5) * 0.2;
      
      const spyPrice = this.spyBasePrice - (randomSpyChange * (points - i) / 10);
      const navValue = this.navBasePrice - (randomNavChange * (points - i) / 10);
      const difference = spyPrice - navValue;
      
      const dataPoint = {
        timestamp,
        spy_price: spyPrice,
        nav_value: navValue,
        difference
      };
      
      this.data.push(dataPoint);
    }
  }

  /**
   * Get all stored data
   * @returns {Array} The complete dataset
   */
  getData() {
    return this.data;
  }

  /**
   * Get the most recent data point
   * @returns {Object|null} The latest data point or null if no data
   */
  getLatestData() {
    if (this.data.length === 0) {
      return null;
    }
    return this.data[this.data.length - 1];
  }
}

// Create a singleton instance
const financeService = new FinanceService();

// Pre-populate with some initial data
financeService.generateInitialData(60);

export default financeService;
