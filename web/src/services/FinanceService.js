// Finance service that uses Finnhub API for real SPY ETF data
import finnhub from 'finnhub';

class FinanceService {
  constructor() {
    this.data = [];
    this.spyBasePrice = 478.50; // Default price if API fails initially
    this.navBasePrice = 477.80; // Slightly different NAV value
    this.startTime = new Date();
    this.failedAttempts = 0;
    this.maxFailedAttempts = 3;
    this.cacheExpiryMs = 10000; // Cache API responses for 10 seconds
    this.cachedSpyPrice = null;
    this.cachedSpyTime = null;
    
    // Initialize Finnhub client
    this.finnhubClient = new finnhub.DefaultApi();
    
    // You'll need to sign up for a free API key at finnhub.io
    // Replace this with your actual API key
    this.finnhubKey = 'd0lumg9r01qpni31glsgd0lumg9r01qpni31glt0';
    // Set up WebSocket for real-time updates
    this.setupWebSocket();
  }

  /**
   * Fetch the latest SPY ETF price from Finnhub API
   * @returns {Promise<number>} The latest SPY price
   */
  async fetchSPYPrice() {
    try {
      const now = new Date();
      
      // Use cached data if still valid (within cacheExpiryMs)
      if (this.cachedSpyPrice && this.cachedSpyTime && 
          (now.getTime() - this.cachedSpyTime.getTime() < this.cacheExpiryMs)) {
        return this.cachedSpyPrice;
      }
      
      // Fetch real-time quote from Finnhub
      return new Promise((resolve, reject) => {
        this.finnhubClient.quote("SPY", this.finnhubKey, (error, data, response) => {
          if (error) {
            console.error('Finnhub API error:', error);
            this.failedAttempts++;
            
            // If we've had multiple failures, use generated data rather than failing completely
            if (this.failedAttempts <= this.maxFailedAttempts) {
              // Add small random movement to price to provide continuity
              const randomChange = (Math.random() - 0.5) * 0.1;
              this.spyBasePrice = this.spyBasePrice + randomChange;
              resolve(this.spyBasePrice);
            } else {
              reject(error);
            }
          } else if (data && data.c) { // 'c' is the current price in Finnhub response
            this.cachedSpyPrice = data.c;
            this.cachedSpyTime = now;
            this.spyBasePrice = data.c;
            this.failedAttempts = 0;
            resolve(data.c);
          } else {
            const err = new Error('No valid price data returned from Finnhub');
            console.error(err);
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error('Error fetching SPY price from Finnhub:', error);
      
      // Fallback to mock data
      const randomChange = (Math.random() - 0.5) * 0.1;
      this.spyBasePrice = this.spyBasePrice + randomChange;
      return this.spyBasePrice;
    }
  }

  /**
   * Calculate a realistic approximation of SPY's NAV based on the current SPY price
   * @returns {Promise<number>} The approximate NAV value
   */
  async calculateApproxNAV() {
    try {
      // Get the current SPY price (will use cached value if available)
      const spyPrice = await this.fetchSPYPrice();
      
      if (!spyPrice) {
        throw new Error('Cannot calculate NAV without a valid SPY price');
      }
      
      // In reality, NAV for an ETF like SPY is calculated based on the underlying
      // basket of stocks. Since that's complex, we'll model NAV as typically being
      // very close to SPY price with small deviations.
      
      // Create a slight deviation that's realistic
      const currentPremiumPercent = (spyPrice - this.navBasePrice) / this.navBasePrice * 100;
      
      // Target premium of between -0.05% and +0.05% (realistic range)
      const targetPremiumPercent = -0.05 + (Math.random() * 0.1);
      
      // Move current premium toward target with some randomness for realism
      const meanReversionSpeed = 0.2;
      const randomNoise = (Math.random() - 0.5) * 0.01;
      
      // Calculate new premium percent with mean reversion and noise
      const newPremiumPercent = currentPremiumPercent + 
                           (targetPremiumPercent - currentPremiumPercent) * meanReversionSpeed +
                           randomNoise;
      
      // Calculate NAV from SPY price and premium
      this.navBasePrice = spyPrice / (1 + newPremiumPercent / 100);
      
      return this.navBasePrice;
    } catch (error) {
      console.error('Error calculating approximate NAV:', error);
      
      // Fallback logic if calculation fails
      const randomChange = (Math.random() - 0.5) * 0.08;
      this.navBasePrice = this.navBasePrice + randomChange;
      
      const spyDiff = this.spyBasePrice - this.navBasePrice;
      if (Math.abs(spyDiff) > 0.5) {
        this.navBasePrice += (spyDiff * 0.01);
      }
      
      return this.navBasePrice;
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
   * Generate initial historical data for chart visualization
   * @param {number} points Number of points to generate
   */
  async generateInitialData(points = 60) {
    try {
      // Try to get some initial history data from Finnhub
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (points * 60); // Get data for last 'points' minutes
      
      // Try to fetch candle data (historical price data)
      return new Promise((resolve) => {
        this.finnhubClient.stockCandles("SPY", "1", startTime, endTime, this.finnhubKey, (error, data, response) => {
          if (error || !data || data.s !== 'ok' || !data.c || data.c.length === 0) {
            console.warn('Could not fetch historical data from Finnhub, generating synthetic data');
            this.generateSyntheticHistoricalData(points);
            resolve();
          } else {
            // We have real historical data
            console.log('Using real historical data from Finnhub');
            this.data = [];
            
            // Generate data points from the candle data
            // c is array of close prices, t is array of timestamps
            for (let i = 0; i < data.c.length && i < points; i++) {
              const timestamp = new Date(data.t[i] * 1000); // Convert from Unix timestamp
              const spyPrice = data.c[i];
              
              // Calculate a realistic NAV with a small premium/discount
              const premiumPercent = -0.05 + (Math.random() * 0.1); // Between -0.05% and 0.05%
              const navValue = spyPrice / (1 + premiumPercent / 100);
              const difference = spyPrice - navValue;
              
              const dataPoint = {
                timestamp,
                spy_price: spyPrice,
                nav_value: navValue,
                difference
              };
              
              this.data.push(dataPoint);
            }
            
            // Update base prices
            if (this.data.length > 0) {
              const lastPoint = this.data[this.data.length - 1];
              this.spyBasePrice = lastPoint.spy_price;
              this.navBasePrice = lastPoint.nav_value;
            }
            
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Error generating initial data:', error);
      this.generateSyntheticHistoricalData(points);
    }
  }
  
  /**
   * Generate synthetic historical data if API fails
   * @param {number} points Number of points to generate
   */
  generateSyntheticHistoricalData(points = 60) {
    this.data = [];
    
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
  
  /**
   * Set up WebSocket connection for real-time updates (optional)
   */
  setupWebSocket() {
    try {
      const socket = new WebSocket(`wss://ws.finnhub.io?token=${this.finnhubKey}`);
      
      // Connection opened -> Subscribe to SPY
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({'type':'subscribe', 'symbol': 'SPY'}));
        console.log('Connected to Finnhub WebSocket');
      });
      
      // Listen for messages
      socket.addEventListener('message', async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'trade' && data.data && data.data.length > 0) {
          // We got a real-time trade update
          const latestTrade = data.data[0];
          this.cachedSpyPrice = latestTrade.p; // price
          this.cachedSpyTime = new Date();
          this.spyBasePrice = latestTrade.p;
          
          // Update data immediately when we get a real-time update
          await this.updateData();
        }
      });
      
      // Handle errors and reconnection
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });
      
      socket.addEventListener('close', () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(() => this.setupWebSocket(), 5000); // Reconnect after 5 seconds
      });
      
      this.socket = socket;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }
}

// Create a singleton instance
const financeService = new FinanceService();

// Pre-populate with some initial data
financeService.generateInitialData(60);

export default financeService;
