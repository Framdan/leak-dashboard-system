import React from "react";
import "./PressureChart.css";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-date">{label}</p>
        <div className="tooltip-values">
          <p className="tooltip-max">Max Pressure : {payload[0].value.toFixed(2)}</p>
          <p className="tooltip-avg">Avg Pressure : {(payload[0].value * 0.8).toFixed(1)}</p>
          <p className="tooltip-min">Min Pressure : {(payload[0].value * 0.6).toFixed(2)}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function PressureChart({ data }) {
  // Add some mock dates for the X axis if not present
  const enrichedData = data.map((d, i) => ({
    ...d,
    date: `Apr ${17 + i}`
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={enrichedData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
        <defs>
          <linearGradient id="colorPressure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          axisLine={{ stroke: '#9ca3af' }} 
          tickLine={{ stroke: '#9ca3af' }} 
          tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
          dy={10}
        />
        <YAxis 
          axisLine={{ stroke: '#9ca3af' }} 
          tickLine={{ stroke: '#9ca3af' }} 
          tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="pressure" 
          stroke="#10b981" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorPressure)" 
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          content={(props) => {
            return (
              <div className="custom-chart-legend">
                <span className="legend-item max"><span className="dot red"></span> Max Pressure</span>
                <span className="legend-item avg"><span className="dot blue"></span> Avg Pressure</span>
                <span className="legend-item min"><span className="dot green"></span> Min Pressure</span>
              </div>
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}