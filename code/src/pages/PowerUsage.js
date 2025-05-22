import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Helper function to get stored power history
const getStoredPowerHistory = () => {
  const stored = localStorage.getItem('powerHistory');
  if (stored) {
    const { history, timestamps } = JSON.parse(stored);
    // Only keep data from the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const validData = timestamps.map((time, index) => ({
      time: new Date(time).getTime(),
      value: history[index]
    })).filter(item => item.time > oneHourAgo);

    return {
      history: validData.map(item => item.value),
      timestamps: validData.map(item => new Date(item.time).toLocaleTimeString())
    };
  }
  return { history: [], timestamps: [] };
};

function PowerUsage({ devices }) {
  const [powerHistory, setPowerHistory] = useState(() => getStoredPowerHistory().history);
  const [timestamps, setTimestamps] = useState(() => getStoredPowerHistory().timestamps);

  // Calculate total power usage
  const totalPowerUsage = devices.reduce((total, device) => total + device.getCurrentPowerUsage(), 0);

  // Calculate power warnings with severity levels
  const powerWarnings = {
    highUsage: {
      active: totalPowerUsage > 300,
      severity: 'high',
      weight: 30,
      message: `Power Usage: ${totalPowerUsage}W (High)`
    },
    lightsOn: {
      active: devices.filter(d => d.type === 'Light' && d.functionState === 'on').length > 1,
      severity: 'medium',
      weight: 15,
      message: 'Multiple Lights On'
    },
    thermostatExtreme: {
      active: devices.some(d => 
        d.type === 'Thermostat' && (d.functionState > 25 || d.functionState < 18)
      ),
      severity: 'high',
      weight: 25,
      message: 'Extreme Thermostat Setting'
    },
    doorsUnlocked: {
      active: devices.some(d => 
        d.type === 'Door' && d.functionState === 'unlocked'
      ),
      severity: 'low',
      weight: 10,
      message: 'Doors Unlocked'
    },
    cameraRecording: {
      active: devices.some(d => 
        d.type === 'Camera' && d.functionState === 'recording'
      ),
      severity: 'medium',
      weight: 20,
      message: 'Camera Recording Active'
    }
  };

  // Calculate power score with weighted warnings
  const calculatePowerScore = () => {
    let score = 100;
    let totalWeight = 0;
    let activeWeight = 0;

    // Calculate total possible weight and active weight
    Object.values(powerWarnings).forEach(warning => {
      totalWeight += warning.weight;
      if (warning.active) {
        activeWeight += warning.weight;
      }
    });

    // Calculate score based on active weight percentage
    if (totalWeight > 0) {
      const weightPercentage = (activeWeight / totalWeight) * 100;
      score = Math.max(0, 100 - weightPercentage);
    }

    return Math.round(score);
  };

  const powerScore = calculatePowerScore();
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green - Excellent
    if (score >= 60) return '#8BC34A'; // Light Green - Good
    if (score >= 40) return '#FFC107'; // Yellow - Fair
    if (score >= 20) return '#FF9800'; // Orange - Poor
    return '#F44336'; // Red - Critical
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  // Update power history every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      setPowerHistory(prev => {
        const newHistory = [...prev, totalPowerUsage];
        // Keep only last 720 data points (1 hour of data at 5-second intervals)
        return newHistory.slice(-720);
      });
      
      setTimestamps(prev => {
        const newTimestamps = [...prev, timeString];
        return newTimestamps.slice(-720);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPowerUsage]);

  // Save to localStorage whenever history updates
  useEffect(() => {
    localStorage.setItem('powerHistory', JSON.stringify({
      history: powerHistory,
      timestamps: timestamps.map(time => new Date().toDateString() + ' ' + time)
    }));
  }, [powerHistory, timestamps]);

  // Calculate power usage by device type
  const powerByType = devices.reduce((acc, device) => {
    const type = device.type;
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += device.getCurrentPowerUsage();
    return acc;
  }, {});

  // Prepare data for pie chart
  const pieChartData = {
    labels: Object.keys(powerByType),
    datasets: [
      {
        data: Object.values(powerByType),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  // Get the last 5 minutes of data (60 points at 5-second intervals)
  const recentHistory = powerHistory.slice(-60);
  const recentTimestamps = timestamps.slice(-60);

  // Prepare data for line chart
  const lineChartData = {
    labels: recentTimestamps,
    datasets: [
      {
        label: 'Total Power Usage (watts)',
        data: recentHistory,
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animation for smoother updates
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Live Power Usage (Last 5 Minutes)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Watts'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        }
      }
    },
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Power Usage by Device Type',
      },
    },
  };

  return (
    <div style={{ padding: 32, display: 'flex', gap: 32 }}>
      <div style={{ flex: 1 }}>
        <h2>Power Usage</h2>
        
        {/* Live Graph Section - Full Width */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Live Power Usage</h3>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4BC0C0' }}>
              {totalPowerUsage} watts
            </div>
          </div>
          <div style={{ height: 200, width: '100%' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div style={{ borderBottom: '1px solid #ddd', marginTop: 8 }}></div>
        </div>

        {/* Device Information Section */}
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <h3>Power Usage by Device Type</h3>
            <div style={{ height: 250 }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <h3>Device Details</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8, width: '60%' }}>Device Type</th>
                  <th style={{ textAlign: 'right', padding: 8, paddingRight: 32, width: '40%' }}>Power Usage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(powerByType).map(([type, usage]) => (
                  <tr key={type}>
                    <td style={{ padding: 4 }}>{type}</td>
                    <td style={{ textAlign: 'right', padding: 4, paddingRight: 32 }}>{usage} watts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Power Summary Section */}
      <div style={{ width: 300, borderLeft: '1px solid #ddd', paddingLeft: 32 }}>
        <h3>Power Summary</h3>
        
        {/* Power Score */}
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          backgroundColor: getScoreColor(powerScore),
          color: 'white',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>Power Score</div>
          <div style={{ fontSize: 48, fontWeight: 'bold' }}>{powerScore}</div>
          <div style={{ fontSize: 18, marginTop: 8 }}>{getScoreMessage(powerScore)}</div>
        </div>

        {/* Warnings */}
        <div style={{ marginBottom: 24 }}>
          <h4>Warnings</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(powerWarnings).some(([_, warning]) => warning.active) ? (
              <>
                {Object.entries(powerWarnings).map(([key, warning]) => 
                  warning.active && (
                    <div key={key} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      color: '#F44336'
                    }}>
                      ⚠️
                      <span>{warning.message}</span>
                    </div>
                  )
                )}
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                color: '#4CAF50'
              }}>
                ✓
                <span>All Systems Normal</span>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4>Recommendations</h4>
          {Object.entries(powerWarnings).some(([_, warning]) => warning.active) ? (
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {powerWarnings.highUsage.active && <li>Consider turning off some devices</li>}
              {powerWarnings.lightsOn.active && <li>Turn off lights in unused rooms</li>}
              {powerWarnings.thermostatExtreme.active && <li>Adjust thermostat to 18-25°C</li>}
              {powerWarnings.doorsUnlocked.active && <li>Lock doors</li>}
              {powerWarnings.cameraRecording.active && <li>Stop camera recording</li>}
            </ul>
          ) : (
            <div style={{ color: '#4CAF50', padding: '8px 0' }}>
              Great job! Your devices are being used efficiently.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PowerUsage; 