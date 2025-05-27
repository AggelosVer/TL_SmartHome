import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

// Helper function to get stored power history
const getStoredPowerHistory = () => {
  const stored = localStorage.getItem('powerHistory');
  if (stored) {
    const { history, timestamps, deviceSnapshots } = JSON.parse(stored);
    return { history, timestamps, deviceSnapshots: deviceSnapshots || [] };
  }
  return { history: [], timestamps: [], deviceSnapshots: [] };
};

function PowerUsage({ devices }) {
  const [powerHistory, setPowerHistory] = useState(() => getStoredPowerHistory().history);
  const [timestamps, setTimestamps] = useState(() => getStoredPowerHistory().timestamps);
  const [deviceSnapshots, setDeviceSnapshots] = useState(() => getStoredPowerHistory().deviceSnapshots);
  const [selectedRange, setSelectedRange] = useState('day'); // default to 'day'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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

    Object.values(powerWarnings).forEach(warning => {
      totalWeight += warning.weight;
      if (warning.active) {
        activeWeight += warning.weight;
      }
    });

    if (totalWeight > 0) {
      const weightPercentage = (activeWeight / totalWeight) * 100;
      score = Math.max(0, 100 - weightPercentage);
    }

    return Math.round(score);
  };

  const powerScore = calculatePowerScore();
  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return '#FFC107';
    if (score >= 20) return '#FF9800';
    return '#F44336';
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
      setPowerHistory(prev => {
        const newHistory = [...prev, totalPowerUsage];
        return newHistory.slice(-518400);
      });
      setTimestamps(prev => {
        const newTimestamps = [...prev, now.toISOString()];
        return newTimestamps.slice(-518400);
      });
      setDeviceSnapshots(prev => {
        const snapshot = devices.map(d => ({
          type: d.type,
          functionState: d.functionState,
          powerUsage: d.getCurrentPowerUsage()
        }));
        return [...prev, snapshot].slice(-518400);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [totalPowerUsage, devices]);

  // Save to localStorage whenever history updates
  useEffect(() => {
    localStorage.setItem('powerHistory', JSON.stringify({
      history: powerHistory,
      timestamps: timestamps,
      deviceSnapshots: deviceSnapshots
    }));
  }, [powerHistory, timestamps, deviceSnapshots]);

  // Helper to get ms for each range
  const rangeToMs = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  // Filter data based on selection
  const now = Date.now();
  let filtered = [];
  if (selectedRange === 'custom' && customStart && customEnd) {
    const start = new Date(customStart).getTime();
    const end = new Date(customEnd).getTime();
    filtered = powerHistory
      .map((value, idx) => ({
        value,
        time: new Date(timestamps[idx]).getTime(),
        snapshot: deviceSnapshots[idx]
      }))
      .filter(item => item.time >= start && item.time <= end);
  } else if (selectedRange === 'day' && customStart) {
    // Show all data for the selected day
    const dayStart = new Date(customStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(customStart);
    dayEnd.setHours(23, 59, 59, 999);
    filtered = powerHistory
      .map((value, idx) => ({
        value,
        time: new Date(timestamps[idx]).getTime(),
        snapshot: deviceSnapshots[idx]
      }))
      .filter(item => item.time >= dayStart.getTime() && item.time <= dayEnd.getTime());
  } else if (selectedRange === 'month' && customStart) {
    // Show all data for the selected month
    const monthStart = new Date(customStart);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(customStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    filtered = powerHistory
      .map((value, idx) => ({
        value,
        time: new Date(timestamps[idx]).getTime(),
        snapshot: deviceSnapshots[idx]
      }))
      .filter(item => item.time >= monthStart.getTime() && item.time <= monthEnd.getTime());
  } else {
    // Default: last hour/day/month from now
    filtered = powerHistory
      .map((value, idx) => ({
        value,
        time: new Date(timestamps[idx]).getTime(),
        snapshot: deviceSnapshots[idx]
      }))
      .filter(item => item.time > now - rangeToMs[selectedRange]);
  }
  const filteredHistory = filtered.map(item => item.value);
  const filteredTimestamps = filtered.map(item => new Date(item.time).toLocaleString());

  // Pie chart: aggregate device type usage over the filtered range
  const pieTypeTotals = {};
  filtered.forEach(item => {
    if (item.snapshot) {
      item.snapshot.forEach(d => {
        if (!pieTypeTotals[d.type]) pieTypeTotals[d.type] = 0;
        pieTypeTotals[d.type] += d.powerUsage;
      });
    }
  });

  const pieChartData = {
    labels: Object.keys(pieTypeTotals),
    datasets: [
      {
        data: Object.values(pieTypeTotals),
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

  // Device details table for filtered range
  const deviceTypeTotals = {};
  filtered.forEach(item => {
    if (item.snapshot) {
      item.snapshot.forEach(d => {
        if (!deviceTypeTotals[d.type]) deviceTypeTotals[d.type] = 0;
        deviceTypeTotals[d.type] += d.powerUsage;
      });
    }
  });

  // Prepare data for line chart
  const lineChartData = {
    labels: filteredTimestamps,
    datasets: [
      {
        label: 'Total Power Usage (watts)',
        data: filteredHistory,
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
    animation: { duration: 0 },
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Power Usage (Selected Range)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Watts' }
      },
      x: {
        title: { display: true, text: 'Time' },
        ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }
      }
    },
  };

  const pieChartOptions = {
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'Power Usage by Device Type (Selected Range)' },
    },
  };

  return (
    <div style={{ padding: 32, display: 'flex', gap: 32 }}>
      <div style={{ flex: 1 }}>
        <h2>Power Usage</h2>
        <div style={{ marginBottom: 16 }}>
          <label>Show data for: </label>
          <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}>
            <option value="hour">Last Hour</option>
            <option value="day">Specific Day</option>
            <option value="month">Specific Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {selectedRange === 'day' && (
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          )}
          {selectedRange === 'month' && (
            <input
              type="month"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              style={{ marginLeft: 8 }}
            />
          )}
          {selectedRange === 'custom' && (
            <span style={{ marginLeft: 8 }}>
              <input
                type="datetime-local"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
              />
              <span style={{ margin: '0 8px' }}>to</span>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
              />
            </span>
          )}
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Power Usage Over Time</h3>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4BC0C0' }}>
              {filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1] : 0} watts
            </div>
          </div>
          <div style={{ height: 200, width: '100%' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div style={{ borderBottom: '1px solid #ddd', marginTop: 8 }}></div>
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <h3>Power consumption by Device Type</h3>
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
                  <th style={{ textAlign: 'right', padding: 8, paddingRight: 32, width: '40%' }}>Power Usage (kW)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(deviceTypeTotals).map(([type, usage]) => (
                  <tr key={type}>
                    <td style={{ padding: 4 }}>{type}</td>
                    <td style={{ textAlign: 'right', padding: 4, paddingRight: 32 }}>
                      {(usage / 1000).toFixed(3)} kW
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={{ width: 300, borderLeft: '1px solid #ddd', paddingLeft: 32 }}>
        <h3>Power Summary</h3>
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