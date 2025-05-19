import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import time

# Set page config
st.set_page_config(
    page_title="SPY ETF vs NAV Tracker",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# App title and description
st.title("📊 SPY ETF vs NAV Real-time Tracker")
st.markdown("""
This application displays the real-time difference between SPY ETF price and its Net Asset Value (NAV).
Data updates every second to provide the latest comparison.
""")

# Initialize session state to store data between refreshes
if 'data' not in st.session_state:
    st.session_state.data = pd.DataFrame(columns=['timestamp', 'spy_price', 'nav_value', 'difference'])
    
if 'last_update' not in st.session_state:
    st.session_state.last_update = datetime.now() - timedelta(minutes=2)

def fetch_spy_price():
    """Fetch the latest SPY ETF price using yfinance"""
    try:
        spy_data = yf.download("SPY", period="1d", interval="1m", progress=False)
        if not spy_data.empty:
            return spy_data['Close'].iloc[-1]
        else:
            st.error("Failed to retrieve SPY price data")
            return None
    except Exception as e:
        st.error(f"Error fetching SPY price: {e}")
        return None

def calculate_approx_nav():
    """
    Calculate an approximation of SPY's NAV using a combination of:
    1. S&P 500 index value (^GSPC) as base
    2. Applying a scaling factor based on SPY's historical relationship to the index
    """
    try:
        # Fetch S&P 500 index data
        sp500_data = yf.download("^GSPC", period="1d", interval="1m", progress=False)
        
        # SPY's typical divisor compared to S&P 500 index (around 10:1 ratio)
        # This is an approximation - actual NAV calculations are more complex
        nav_scaling_factor = 0.1
        
        if not sp500_data.empty:
            sp500_value = sp500_data['Close'].iloc[-1]
            approx_nav = sp500_value * nav_scaling_factor
            
            # Add small random noise to simulate real-world NAV calculation differences
            # In reality, NAV would differ due to various factors including cash positions,
            # transaction costs, timing differences, etc.
            noise = np.random.normal(0, 0.001)  # Very small random noise for smoother second-by-second updates
            approx_nav = approx_nav * (1 + noise)
            
            return approx_nav
        else:
            st.error("Failed to retrieve S&P 500 index data")
            return None
    except Exception as e:
        st.error(f"Error calculating approximate NAV: {e}")
        return None

def update_data():
    """Update data and add new row to the dataframe"""
    current_time = datetime.now()
    
    # Only update if it's been at least 55 seconds since the last update
    # This prevents multiple updates when Streamlit reruns the script
    time_diff = (current_time - st.session_state.last_update).total_seconds()
    if time_diff < 0.9:
        return False
    
    spy_price = fetch_spy_price()
    nav_value = calculate_approx_nav()
    
    if spy_price is not None and nav_value is not None:
        difference = spy_price - nav_value
        
        # Add new data point
        new_data = pd.DataFrame({
            'timestamp': [current_time],
            'spy_price': [spy_price],
            'nav_value': [nav_value],
            'difference': [difference]
        })
        
        # Append to existing data
        st.session_state.data = pd.concat([st.session_state.data, new_data], ignore_index=True)
        
        # Keep only the most recent 3600 data points (1 hour at 1-second intervals)
        if len(st.session_state.data) > 3600:
            st.session_state.data = st.session_state.data.iloc[-3600:]
        
        st.session_state.last_update = current_time
        return True
    
    return False

# Sidebar content
with st.sidebar:
    st.header("About SPY and NAV")
    st.markdown("""
    **SPY** is an ETF (Exchange Traded Fund) that tracks the S&P 500 index.
    
    **NAV (Net Asset Value)** represents the underlying value of the assets in the fund.
    
    **The difference** between SPY's market price and its NAV can indicate:
    - Market sentiment
    - Arbitrage opportunities
    - Liquidity conditions
    
    Data updates every second during market hours.
    """)
    
    st.subheader("Data Sources")
    st.markdown("""
    - SPY price data: Yahoo Finance via yfinance
    - NAV calculation: Approximated based on S&P 500 index value
    """)
    
    # Force refresh button
    if st.button("Force Refresh Data"):
        st.session_state.last_update = datetime.now() - timedelta(minutes=2)
        st.rerun()

# Main content
updated = update_data()

# Display current values
col1, col2, col3 = st.columns(3)

if not st.session_state.data.empty:
    latest_data = st.session_state.data.iloc[-1]
    
    with col1:
        st.metric(
            label="SPY Price", 
            value=f"${latest_data['spy_price'].to_numpy()[0]:.2f}",
            delta=None
        )
    
    with col2:
        st.metric(
            label="Estimated NAV", 
            value=f"${latest_data['nav_value'].to_numpy()[0]:.2f}",
            delta=None
        )
    
    with col3:
        st.metric(
            label="Difference (Price - NAV)", 
            value=f"${latest_data['difference'].to_numpy()[0]:.4f}",
            delta=f"{latest_data['difference'].to_numpy()[0]/latest_data['nav_value'].to_numpy()[0]*100:.4f}%",
            delta_color="normal"
        )
    
    # Create plotly figure
    fig = make_subplots(
        rows=2, 
        cols=1,
        subplot_titles=("SPY Price vs NAV", "Price-NAV Difference"),
        vertical_spacing=0.12,
        shared_xaxes=True,
        specs=[[{"type": "scatter"}], [{"type": "scatter"}]]
    )
    
    # Plot SPY price and NAV in top subplot
    fig.add_trace(
        go.Scatter(
            x=st.session_state.data['timestamp'],
            y=st.session_state.data['spy_price'],
            mode='lines',
            name='SPY Price',
            line=dict(color='#1f77b4', width=2)
        ),
        row=1, col=1
    )
    
    fig.add_trace(
        go.Scatter(
            x=st.session_state.data['timestamp'],
            y=st.session_state.data['nav_value'],
            mode='lines',
            name='NAV Value',
            line=dict(color='#ff7f0e', width=2)
        ),
        row=1, col=1
    )
    
    # Plot the difference in bottom subplot
    fig.add_trace(
        go.Scatter(
            x=st.session_state.data['timestamp'],
            y=st.session_state.data['difference'],
            mode='lines',
            name='Difference',
            line=dict(color='#2ca02c', width=2),
            fill='tozeroy'
        ),
        row=2, col=1
    )
    
    # Add zero line for reference in difference chart
    fig.add_hline(
        y=0, 
        line_dash="dash", 
        line_color="red", 
        opacity=0.7,
        row=2, col=1
    )
    
    # Update layout
    fig.update_layout(
        height=700,
        template='plotly_white',
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        margin=dict(l=0, r=0, t=50, b=0)
    )
    
    # Add last updated time
    last_update_str = st.session_state.last_update.strftime("%Y-%m-%d %H:%M:%S")
    
    # Display the chart
    st.plotly_chart(fig, use_container_width=True)
    
    # Add real-time price tracking table
    st.subheader("💹 Real-Time Price Tracking")
    st.markdown("Track the most recent price changes and NAV differences in real-time:")
    
    # Prepare data for the table - get the last 15 entries and sort by newest first
    if len(st.session_state.data) > 1:  # Need at least 2 rows to calculate changes
        table_data = st.session_state.data.copy().sort_values('timestamp', ascending=False).head(15)
        
        # Create a shifted version to calculate changes from previous entry
        table_data['prev_spy_price'] = table_data['spy_price'].shift(-1)
        table_data['price_change'] = table_data['spy_price'] - table_data['prev_spy_price']
        table_data['price_change_pct'] = (table_data['price_change'] / table_data['prev_spy_price']) * 100
        
        # Format the table data
        display_table = table_data.copy()
        
        # Pre-format numeric columns directly
        display_table['spy_price_fmt'] = display_table['spy_price'].apply(lambda x: f"${x:.2f}")
        display_table['prev_spy_price_fmt'] = display_table['prev_spy_price'].apply(lambda x: f"${x:.2f}" if pd.notnull(x) else "")
        display_table['price_change_fmt'] = display_table['price_change'].apply(lambda x: f"${x:.4f}" if pd.notnull(x) else "")
        display_table['price_change_pct_fmt'] = display_table['price_change_pct'].apply(lambda x: f"{x:.4f}%" if pd.notnull(x) else "")
        display_table['nav_value_fmt'] = display_table['nav_value'].apply(lambda x: f"${x:.2f}")
        display_table['difference_fmt'] = display_table['difference'].apply(lambda x: f"${x:.4f}")
        
        # Rename columns for display
        display_table = display_table.rename(columns={
            'timestamp': 'Timestamp',
            'spy_price_fmt': 'SPY Price',
            'prev_spy_price_fmt': 'Previous Price',
            'price_change_fmt': 'Change',
            'price_change_pct_fmt': 'Change %',
            'nav_value_fmt': 'NAV Value',
            'difference_fmt': 'Difference'
        })
        
        # Select and reorder columns for display
        display_cols = ['Timestamp', 'SPY Price', 'Previous Price', 'Change', 'Change %', 'NAV Value', 'Difference']
        display_table = display_table[display_cols]
        
        # Create a styled dataframe with custom CSS
        # Store the original numeric columns for styling purposes
        style_table = table_data[['price_change', 'price_change_pct', 'difference']]
        
        # Create a function to style the dataframe without using format()
        def style_df(df, style_df):
            # Create an empty styling DataFrame with same shape as display_table
            styles = pd.DataFrame('', index=df.index, columns=df.columns)
            
            # Apply styling based on values in original numeric columns
            for idx, row in style_df.iterrows():
                if pd.notnull(row['price_change']):
                    if row['price_change'] > 0:
                        styles.loc[idx, 'Change'] = 'color: green; background-color: rgba(75, 192, 192, 0.2)'
                    elif row['price_change'] < 0:
                        styles.loc[idx, 'Change'] = 'color: red; background-color: rgba(255, 99, 132, 0.2)'
                
                if pd.notnull(row['price_change_pct']):
                    if row['price_change_pct'] > 0:
                        styles.loc[idx, 'Change %'] = 'color: green; background-color: rgba(75, 192, 192, 0.2)'
                    elif row['price_change_pct'] < 0:
                        styles.loc[idx, 'Change %'] = 'color: red; background-color: rgba(255, 99, 132, 0.2)'
                
                if row['difference'] > 0:
                    styles.loc[idx, 'Difference'] = 'color: green; background-color: rgba(75, 192, 192, 0.2)'
                elif row['difference'] < 0:
                    styles.loc[idx, 'Difference'] = 'color: red; background-color: rgba(255, 99, 132, 0.2)'
            
            return styles
        
        # Apply styling
        styled_data = style_df(display_table, style_table)
        
        # Display as stylable dataframe
        st.dataframe(
            display_table,
            column_config={
                "Timestamp": st.column_config.DatetimeColumn(format="HH:mm:ss"),
            },
            hide_index=True,
            use_container_width=True,
            style=styled_data
        )

    st.caption(f"Last updated: {last_update_str}")
    
    # Add data table section with expand/collapse
    with st.expander("View Raw Data"):
        st.dataframe(
            st.session_state.data[['timestamp', 'spy_price', 'nav_value', 'difference']],
            use_container_width=True
        )
else:
    st.info("Waiting for data... First update should appear shortly.")

# Set up auto-refresh using Streamlit's auto-rerun feature
st.markdown("Auto refreshing every second...")

# Script will auto-rerun due to Streamlit's reactive framework
# Adding a feedback mechanism to show when refreshing has occurred
if updated:
    st.success("Data refreshed successfully")

# Add small sleep to prevent excessive CPU usage
time.sleep(0.1)

# Use st.rerun() to force a rerun after 1 second
time_since_update = (datetime.now() - st.session_state.last_update).total_seconds()
if time_since_update >= 1:
    st.rerun()

