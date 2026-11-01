import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Activity, 
  Volume2, 
  Settings, 
  Plus, 
  Clock, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  UserCheck,
  Stethoscope,
  Megaphone,
  Radio
} from 'lucide-react';
import { getDepartmentStats, seedDemoData } from '../services/db';
import { speakText, speakFullAnnouncement } from '../services/speech';

export default function AdminDashboard({
  currentLang = 'en',
  t = {},
  darkMode = false,
  onNavigate = () => {}
}) {
  const [departments, setDepartments] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('NORMAL');
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'doctors', 'announcement', 'system'

  const isRtl = currentLang === 'ar';

  useEffect(() => {
    try {
      const stats = getDepartmentStats();
      setDepartments(stats);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleBroadcast = () => {
    if (!announcementText.trim()) return;
    setBroadcasting(true);
    
    // Announce via speech
    speakText(announcementText, currentLang);
    
    setTimeout(() => {
      setBroadcasting(false);
      setAnnouncementText('');
    }, 2000);
  };

  const handleQuickResetDemo = () => {
    if (window.confirm('Reset demo data to initial realistic hospital records?')) {
      seedDemoData();
      window.location.reload();
    }
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Top Admin Welcome Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrative Operations Portal</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Hospital Master Command Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live facility governance, staffing, broadcast announcements, and ABDM compliance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('reports')}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              View Analytics
            </button>
            <button
              onClick={handleQuickResetDemo}
              className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-100 dark:hover:bg-red-900/50 transition"
              title="Reset mock hospital database"
            >
              Reset Demo Data
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Facility Overview', icon: Building2 },
            { id: 'announcement', label: 'Live PA Broadcast', icon: Megaphone },
            { id: 'doctors', label: 'Doctor Roster', icon: Stethoscope },
            { id: 'system', label: 'System & ABDM Health', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clinics</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">8 Wings</p>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1">100% operational</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doctors On Duty</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">12 Doctors</p>
              <p className="text-[11px] text-slate-400 mt-1">Across morning & day shifts</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients in Queue</span>
              <p className="text-3xl font-black text-amber-500 mt-1">47 Waiting</p>
              <p className="text-[11px] text-slate-400 mt-1">Estimated avg wait: 14 mins</p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Emergency Trauma</span>
              <p className="text-3xl font-black text-red-500 mt-1">Ready</p>
              <p className="text-[11px] text-slate-400 mt-1">2 Bays Available</p>
            </div>
          </div>

          {/* Department Monitoring Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Real-Time Department Workload & Capacity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((d) => (
                <div 
                  key={d.department}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {d.department}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {d.doctor_count} Doctor(s) • Avg Wait {d.avg_wait_minutes}m
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-black">
                      {d.active_queue} Patients
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. LIVE PA BROADCAST TAB */}
      {activeTab === 'announcement' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hospital Public Address (PA) Voice Announcement
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Broadcast critical audio notifications directly through the hospital voice system in the selected language.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Announcement Message
            </label>
            <textarea
              rows={3}
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="e.g. Attention all visitors: General Medicine OPD consultation is now calling tokens 20 to 35. Please assemble outside Room 101."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quick preset templates */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Preset Announcements
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                'Attention all patients, please maintain social distancing and keep your digital token slips ready.',
                'Pharmacy counter number 2 is now open for senior citizen medicine distribution.',
                'Emergency drill in progress at Trauma Wing. Normal OPD consultations remain unaffected.',
                'Blood donation camp open today on First Floor Conference Hall.'
              ].map((msg, i) => (
                <button
                  key={i}
                  onClick={() => setAnnouncementText(msg)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 text-xs font-semibold transition text-left"
                >
                  "{msg.substring(0, 48)}..."
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleBroadcast}
              disabled={broadcasting || !announcementText.trim()}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{broadcasting ? 'Broadcasting Audio...' : 'Broadcast to All Speakers'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. DOCTORS ROSTER TAB */}
      {activeTab === 'doctors' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Medical Staff Roster & Timetable
              </h3>
              <p className="text-xs text-slate-400">Consultant availability and allocated OPD rooms</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Dr. Vikram Sharma', dept: 'General Medicine', room: 'Room 101', shift: '08:00 - 14:00', status: 'Available' },
              { name: 'Dr. Priya Patel', dept: 'Pediatrics', room: 'Room 104', shift: '09:00 - 15:00', status: 'Consulting' },
              { name: 'Dr. Rajesh Kumar', dept: 'Cardiology', room: 'Room 201', shift: '10:00 - 16:00', status: 'Available' },
              { name: 'Dr. Sunita Rao', dept: 'Orthopedics', room: 'Room 205', shift: '08:30 - 13:30', status: 'In Procedure' },
              { name: 'Dr. Arun Verma', dept: 'ENT', room: 'Room 108', shift: '09:00 - 14:00', status: 'Available' },
              { name: 'Dr. Meera Iyer', dept: 'Gynecology', room: 'Room 110', shift: '08:00 - 14:00', status: 'Available' },
            ].map((doc) => (
              <div 
                key={doc.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.dept}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'Available'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex justify-between text-xs text-slate-400 font-mono">
                  <span>{doc.room}</span>
                  <span>{doc.shift}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SYSTEM & ABDM HEALTH TAB */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              National ABDM / Ayushman Bharat Digital Gateway
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              FHIR R4 health information network connectivity status
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">ABHA Token Generation Engine</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Active • 99.98% uptime</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">OPD Voice TTS Broadcasting Engine</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Web Speech API + Phonetic fallback active</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
