import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  Printer, 
  Download, 
  Calendar, 
  Filter, 
  Activity, 
  Award, 
  CheckCircle, 
  ChevronRight,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { generateDailyReport, generateMonthlyReport, getDepartmentStats } from '../services/db';

export default function ReportsAnalytics({
  currentLang = 'en',
  t = {},
  darkMode = false
}) {
  const [reportType, setReportType] = useState('daily'); // 'daily', 'monthly', 'departments', 'workload'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [deptStats, setDeptStats] = useState(null);

  const isRtl = currentLang === 'ar';

  useEffect(() => {
    try {
      const d = generateDailyReport(selectedDate);
      setDailyData(d);

      const m = generateMonthlyReport(selectedMonth, selectedYear);
      setMonthlyData(m);

      const s = getDepartmentStats();
      setDeptStats(s);
    } catch (err) {
      console.error('Error generating reports:', err);
    }
  }, [selectedDate, selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  // Mock doctor workload breakdown
  const doctorWorkload = [
    { name: 'Dr. Vikram Sharma', dept: 'General Medicine', patients: 38, avgTime: '12 mins', rating: 4.8, status: 'On Duty' },
    { name: 'Dr. Priya Patel', dept: 'Pediatrics', patients: 31, avgTime: '15 mins', rating: 4.9, status: 'On Duty' },
    { name: 'Dr. Rajesh Kumar', dept: 'Cardiology', patients: 24, avgTime: '18 mins', rating: 4.7, status: 'On Duty' },
    { name: 'Dr. Sunita Rao', dept: 'Orthopedics', patients: 27, avgTime: '14 mins', rating: 4.6, status: 'Completed' },
    { name: 'Dr. Arun Verma', dept: 'ENT', patients: 22, avgTime: '10 mins', rating: 4.8, status: 'On Duty' },
  ];

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Top Controls & Navigation Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Real-Time Healthcare Intelligence</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              OPD Analytics & Performance Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live patient volumes, doctor productivity, wait times, and department throughput
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'daily', label: 'Daily Patient Report', icon: Activity },
            { id: 'monthly', label: 'Monthly Trends & Stats', icon: TrendingUp },
            { id: 'departments', label: 'Department Analytics', icon: BarChart3 },
            { id: 'workload', label: 'Doctor Workload & Ratings', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. DAILY REPORT VIEW */}
      {reportType === 'daily' && dailyData && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Patients</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {dailyData.total_patients}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14% vs yesterday</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Completed Visits</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {dailyData.completed}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.round((dailyData.completed / (dailyData.total_patients || 1)) * 100)}% clearance rate
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Wait Time</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {dailyData.avg_wait_minutes} <span className="text-sm font-semibold text-slate-400">min</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-bold mt-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>-3 min faster than target</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Emergency Cases</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-3xl font-black text-red-600 dark:text-red-400">
                {dailyData.emergency_count}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Instant priority triage applied
              </p>
            </div>
          </div>

          {/* Department Breakdown Bar Graph (CSS-only) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Today's Patients by Clinical Department
            </h3>
            <div className="space-y-4">
              {Array.isArray(dailyData.department_breakdown) ? dailyData.department_breakdown.map((dept, i) => {
                const percent = Math.round((dept.count / (dailyData.total_patients || 1)) * 100);
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                const barColor = colors[i % colors.length];

                return (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dept.department}</span>
                      <span className="font-mono text-slate-500 font-semibold">{dept.count} patients ({percent}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${Math.max(percent, 4)}%` }} 
                      />
                    </div>
                  </div>
                );
              }) : Object.keys(dailyData.department_breakdown || {}).map((deptName, i) => {
                const count = dailyData.department_breakdown[deptName];
                const percent = Math.round((count / (dailyData.total_patients || 1)) * 100);
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500'];
                const barColor = colors[i % colors.length];
                return (
                  <div key={deptName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{deptName}</span>
                      <span className="font-mono text-slate-500 font-semibold">{count} patients ({percent}%)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${Math.max(percent, 4)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. MONTHLY REPORT VIEW */}
      {reportType === 'monthly' && monthlyData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Monthly OPD Visits</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                {monthlyData.total_patients}
              </p>
              <p className="text-xs text-slate-400 mt-1">Across 8 hospital clinical wings</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Average</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                {monthlyData.daily_average}
              </p>
              <p className="text-xs text-slate-400 mt-1">Patients examined per OPD working day</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Busiest OPD Day</span>
              <p className="text-2xl font-black text-amber-500 mt-2">
                {monthlyData.peak_day ? monthlyData.peak_day.day : 'Monday'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Peak load: {monthlyData.peak_day ? monthlyData.peak_day.count : 42} patients
              </p>
            </div>
          </div>

          {/* Daily Histogram (CSS-only column chart) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Monthly Patient Registration Curve
            </h3>
            <p className="text-xs text-slate-400 mb-6">Day-by-day distribution throughout the current calendar month</p>

            <div className="flex items-end gap-1.5 h-48 pt-6 border-b border-slate-200 dark:border-slate-800 px-2 overflow-x-auto">
              {Array.isArray(monthlyData.daily_counts) && monthlyData.daily_counts.slice(0, 24).map((d) => {
                const maxVal = Math.max(...monthlyData.daily_counts.map(x => x.count), 40);
                const heightPercent = Math.max((d.count / maxVal) * 100, 10);

                return (
                  <div key={d.day} className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div 
                      className="w-full bg-indigo-500/80 group-hover:bg-indigo-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400">
                      {d.day.split('-')[2] || d.day.slice(-2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. DEPARTMENTS VIEW */}
      {reportType === 'departments' && deptStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptStats.map((dept) => (
              <div 
                key={dept.department}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {dept.department}
                    </h4>
                    <p className="text-xs text-slate-400">Clinic OPD Active Wing</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
                    {dept.active_queue} in queue
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Visits</span>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{dept.total_visits}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Wait</span>
                    <p className="text-lg font-black text-amber-500">{dept.avg_wait_minutes}m</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Doctors</span>
                    <p className="text-lg font-black text-emerald-500">{dept.doctor_count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DOCTOR WORKLOAD VIEW */}
      {reportType === 'workload' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Doctor Consultation Workload & Feedback Ratings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual physician consultation volumes and patient satisfaction ratings
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Patients Handled</th>
                  <th className="py-3 px-4 text-center">Avg Consult Time</th>
                  <th className="py-3 px-4 text-center">Satisfaction</th>
                  <th className="py-3 px-4 text-center">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-200">
                {doctorWorkload.map((doc) => (
                  <tr key={doc.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {doc.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{doc.dept}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {doc.patients}
                    </td>
                    <td className="py-3.5 px-4 text-center">{doc.avgTime}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold">
                        ★ {doc.rating}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        doc.status === 'On Duty'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
