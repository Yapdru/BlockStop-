'use client';

/**
 * Advanced Analytics Dashboard
 * Comprehensive threat analytics and trend analysis for PRO users
 */

import React, { useState } from 'react';
import { AdvancedAnalyticsEngine } from '@/lib/pro/advanced-analytics';

export default function AnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState('threats');
  const [dateRange, setDateRange] = useState('30d');

  // Simulate chart data
  const chartData = [
    { date: '1', value: 45 },
    { date: '2', value: 52 },
    { date: '3', value: 48 },
    { date: '4', value: 61 },
    { date: '5', value: 55 },
    { date: '6', value: 67 },
    { date: '7', value: 72 },
    { date: '8', value: 68 },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Advanced Analytics</h1>
          <p className="text-blue-300">
            Deep threat intelligence analysis with predictive insights and anomaly detection
          </p>
        </div>

        {/* Metric Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { id: 'threats', label: 'Threats', icon: '🔴' },
            { id: 'incidents', label: 'Incidents', icon: '⚠️' },
            { id: 'alerts', label: 'Alerts', icon: '🔔' },
            { id: 'detections', label: 'Detections', icon: '✓' },
          ].map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedMetric === metric.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-blue-300 hover:bg-slate-600'
              }`}
            >
              <span>{metric.icon}</span>
              {metric.label}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-blue-300 hover:bg-slate-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Trend Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Threat Trend</h2>
            <div className="h-64 flex items-end gap-1 bg-slate-700 rounded-lg p-4">
              {chartData.map((point, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm hover:from-blue-600 hover:to-blue-500 transition-colors relative group"
                  style={{ height: `${(point.value / maxValue) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {point.value} threats
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">487</div>
                <div className="text-sm text-slate-400">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">↓ 12%</div>
                <div className="text-sm text-slate-400">Change</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">69</div>
                <div className="text-sm text-slate-400">Average</div>
              </div>
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Anomalies Detected</h2>
            <div className="space-y-3">
              {[
                { date: 'Day 4', severity: 'high', deviation: '+45%' },
                { date: 'Day 6', severity: 'medium', deviation: '+22%' },
                { date: 'Day 7', severity: 'critical', deviation: '+67%' },
                { date: 'Day 8', severity: 'high', deviation: '-25%' },
              ].map((anomaly, i) => (
                <div key={i} className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{anomaly.date}</div>
                      <div className="text-sm text-slate-400">Deviation {anomaly.deviation}</div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        anomaly.severity === 'critical'
                          ? 'bg-red-900 text-red-200'
                          : anomaly.severity === 'high'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {anomaly.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Threat Patterns & Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Threats */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Threats</h2>
            <div className="space-y-4">
              {[
                { threat: 'Malware', count: 145, severity: 'critical' },
                { threat: 'Phishing', count: 98, severity: 'high' },
                { threat: 'Brute Force', count: 67, severity: 'high' },
                { threat: 'Data Leakage', count: 34, severity: 'medium' },
                { threat: 'Unauthorized Access', count: 28, severity: 'medium' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-white">{item.threat}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                      style={{ width: `${(item.count / 145) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correlations */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Threat Correlations</h2>
            <div className="space-y-3">
              {[
                { threat1: 'Malware', threat2: 'C2 Communication', correlation: 92 },
                { threat1: 'Phishing', threat2: 'Credential Theft', correlation: 87 },
                { threat1: 'Brute Force', threat2: 'Unauthorized Access', correlation: 78 },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                  <div className="text-sm font-semibold text-white mb-2">
                    {item.threat1} ↔ {item.threat2}
                  </div>
                  <div className="bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{ width: `${item.correlation}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 text-right">
                    {item.correlation}% correlated
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 bg-slate-800 border border-blue-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Threat Activity',
                value: 'Normal',
                description: 'Threat volume is within baseline',
              },
              {
                title: 'Risk Trend',
                value: 'Improving',
                description: 'Risk score decreased by 12%',
              },
              {
                title: 'Detection Rate',
                value: '98.2%',
                description: 'Above industry average',
              },
            ].map((insight, i) => (
              <div key={i} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                <div className="text-sm text-slate-400 mb-1">{insight.title}</div>
                <div className="text-2xl font-bold text-blue-400 mb-2">{insight.value}</div>
                <div className="text-sm text-slate-400">{insight.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export & Schedule */}
        <div className="mt-6 flex gap-4">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            📊 Export Report
          </button>
          <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-blue-300 font-semibold rounded-lg transition-colors">
            📅 Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
}
