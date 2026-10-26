import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Navigation, 
  Layers, 
  Eye, 
  Volume2, 
  VolumeX, 
  Info, 
  ArrowUpRight,
  ShieldAlert,
  Stethoscope,
  HeartPulse,
  Baby,
  Bone,
  Flower2,
  ScanLine
} from 'lucide-react';
import { speakText, stopSpeaking } from '../services/speech';

export default function HospitalMap({ 
  departments = [], 
  selectedDepartmentId = null, 
  onSelectDepartment = () => {},
  currentLang = 'en',
  t = {}
}) {
  const [activeFloorLevel, setActiveFloorLevel] = useState(0); // 0 = GF, 1 = F1, 2 = F2
  const [hoveredRoom, setHoveredRoom] = useState(null);

  // Sync active floor when selectedDepartmentId changes
  useEffect(() => {
    if (selectedDepartmentId && departments.length > 0) {
      const dept = departments.find(d => d.id === selectedDepartmentId);
      if (dept) {
        if (dept.floor_id === 'GF') setActiveFloorLevel(0);
        else if (dept.floor_id === 'F1') setActiveFloorLevel(1);
        else if (dept.floor_id === 'F2') setActiveFloorLevel(2);
      }
    }
  }, [selectedDepartmentId, departments]);

  const activeDept = departments.find(d => d.id === selectedDepartmentId);

  const handleReadDirections = () => {
    if (!activeDept) return;
    const text = currentLang === 'hi' 
      ? activeDept.directions_hindi 
      : currentLang === 'ta' 
        ? activeDept.directions_tamil 
        : activeDept.directions_text;
    speakText(text, currentLang);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Layers className="w-4 h-4" />
            <span>Interactive Wayfinding Blueprint</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
            {t.map?.title || 'Hospital Navigation Floor Plan'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click rooms or select a department to illuminate the exact floor route.
          </p>
        </div>

        {/* Floor Level Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto">
          {[
            { level: 0, label: t.map?.groundFloor || 'Ground Floor', tag: 'GF' },
            { level: 1, label: t.map?.firstFloor || '1st Floor', tag: 'F1' },
            { level: 2, label: t.map?.secondFloor || '2nd Floor', tag: 'F2' }
          ].map(f => (
            <button
              key={f.level}
              onClick={() => setActiveFloorLevel(f.level)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeFloorLevel === f.level
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-indigo-500'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFloorLevel === f.level ? '#6366f1' : '#94a3b8' }} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Department Route Callout */}
      {activeDept && (
        <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white font-bold"
              style={{ backgroundColor: activeDept.color || '#6366f1' }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-white">
                  {currentLang === 'hi' ? activeDept.hindi_name : currentLang === 'ta' ? activeDept.tamil_name : activeDept.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activeDept.room_number}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({activeDept.floor_name})
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {currentLang === 'hi' 
                  ? activeDept.directions_hindi 
                  : currentLang === 'ta' 
                    ? activeDept.directions_tamil 
                    : activeDept.directions_text}
              </p>
            </div>
          </div>
          <button
            onClick={handleReadDirections}
            className="self-start sm:self-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
            title="Read directions out loud"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Guide</span>
          </button>
        </div>
      )}

      {/* SVG Blueprint Viewer */}
      <div className="mt-4 relative bg-slate-950 rounded-xl p-4 overflow-hidden border border-slate-800 shadow-inner">
        {/* Floor label badge on map */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-slate-200">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {activeFloorLevel === 0 && 'LEVEL 0 • GROUND FLOOR (EMERGENCY & OUTPATIENT)'}
            {activeFloorLevel === 1 && 'LEVEL 1 • FIRST FLOOR (CARDIOLOGY & PEDIATRICS)'}
            {activeFloorLevel === 2 && 'LEVEL 2 • SECOND FLOOR (ORTHOPEDICS & MATERNITY)'}
          </span>
        </div>

        {/* Legend */}
        <div className="absolute top-6 right-6 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span className="text-emerald-300 font-medium">Route Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1 bg-red-500 rounded" />
            <span>Emergency</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-1 bg-blue-500 rounded" />
            <span>OPD Lines</span>
          </div>
        </div>

        {/* SVG RENDER */}
        <div className="w-full flex justify-center py-2">
          <svg
            viewBox="0 0 900 480"
            className="w-full max-w-4xl h-auto select-none font-sans"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          >
            {/* Architectural Grid pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
              {/* Pulsing glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background grid */}
            <rect width="900" height="480" fill="#0f172a" />
            <rect width="900" height="480" fill="url(#grid)" />

            {/* External building outline */}
            <rect x="40" y="40" width="820" height="400" rx="16" fill="#1e293b" fillOpacity="0.4" stroke="#334155" strokeWidth="3" />

            {/* =========================================================================
                LEVEL 0: GROUND FLOOR
               ========================================================================= */}
            {activeFloorLevel === 0 && (
              <g id="ground-floor">
                {/* Main Hallway Corridor */}
                <rect x="180" y="200" width="540" height="80" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                <text x="450" y="245" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                  CENTRAL GROUND CORRIDOR • FOLLOW COLOR LINES
                </text>

                {/* 1. Main Entrance & Central Lobby */}
                <g 
                  onClick={() => onSelectDepartment('W-REG')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect x="360" y="320" width="180" height="100" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                  <rect x="410" y="415" width="80" height="10" fill="#38bdf8" />
                  <text x="450" y="355" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">MAIN ENTRANCE</text>
                  <text x="450" y="375" fill="#94a3b8" fontSize="11" textAnchor="middle">Reception & Help Desk</text>
                  <text x="450" y="395" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">[ YOU ARE HERE ]</text>
                </g>

                {/* 2. Emergency & Trauma Red Bay (East Wing) */}
                <g 
                  onClick={() => onSelectDepartment('EMER')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="60" width="220" height="120" rx="8" 
                    fill={selectedDepartmentId === 'EMER' ? '#450a0a' : '#1e1b4b'} 
                    stroke="#ef4444" 
                    strokeWidth={selectedDepartmentId === 'EMER' ? '3' : '2'}
                    filter={selectedDepartmentId === 'EMER' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="75" width="28" height="28" rx="6" fill="#ef4444" />
                  <text x="89" y="94" fill="#ffffff" fontSize="16" fontWeight="bold" textAnchor="middle">🚨</text>
                  <text x="115" y="88" fill="#f87171" fontSize="13" fontWeight="bold">EMERGENCY & TRAUMA</text>
                  <text x="115" y="104" fill="#fca5a5" fontSize="11">Bay 1 (Red Zone)</text>
                  <text x="75" y="140" fill="#94a3b8" fontSize="10">Dr. Vikram Singhania (Trauma Head)</text>
                  <text x="75" y="160" fill="#ef4444" fontSize="10" fontWeight="bold">● ZERO WAIT • IMMEDIATE PRIORITY</text>
                </g>

                {/* 3. General Medicine OPD (West Wing) */}
                <g 
                  onClick={() => onSelectDepartment('GENMED')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="240" width="220" height="120" rx="8" 
                    fill={selectedDepartmentId === 'GENMED' ? '#064e3b' : '#0f172a'} 
                    stroke="#10b981" 
                    strokeWidth={selectedDepartmentId === 'GENMED' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'GENMED' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="255" width="24" height="24" rx="6" fill="#10b981" />
                  <text x="87" y="272" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">🩺</text>
                  <text x="110" y="268" fill="#34d399" fontSize="13" fontWeight="bold">GENERAL MEDICINE</text>
                  <text x="110" y="284" fill="#a7f3d0" fontSize="11">Room 012 • Dr. Anita Verma</text>
                  <text x="75" y="320" fill="#94a3b8" fontSize="10">West Hallway • Follow Green Floor Line</text>
                </g>

                {/* 4. Diagnostics, X-Ray & Ultrasound (North Corridor) */}
                <g 
                  onClick={() => onSelectDepartment('RADIO')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="340" y="60" width="220" height="120" rx="8" 
                    fill={selectedDepartmentId === 'RADIO' ? '#164e63' : '#0f172a'} 
                    stroke="#06b6d4" 
                    strokeWidth={selectedDepartmentId === 'RADIO' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'RADIO' ? 'url(#glow)' : undefined}
                  />
                  <rect x="355" y="75" width="24" height="24" rx="6" fill="#06b6d4" />
                  <text x="367" y="92" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">🔬</text>
                  <text x="390" y="88" fill="#22d3ee" fontSize="13" fontWeight="bold">DIAGNOSTICS & X-RAY</text>
                  <text x="390" y="104" fill="#a5f3fc" fontSize="11">Room 018 • Dr. Suresh Reddy</text>
                  <text x="355" y="140" fill="#94a3b8" fontSize="10">North Corridor • Follow Cyan Line</text>
                </g>

                {/* 5. Central Pharmacy & Dispensary */}
                <g className="cursor-default">
                  <rect x="620" y="240" width="220" height="120" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  <text x="640" y="275" fill="#f8fafc" fontSize="13" fontWeight="bold">CENTRAL PHARMACY</text>
                  <text x="640" y="295" fill="#94a3b8" fontSize="11">Medicine Counter 1 - 6</text>
                  <text x="640" y="325" fill="#cbd5e1" fontSize="10">Free Generic Medicines Dispensary</text>
                </g>

                {/* Lifts & Vertical Transport to Floors 1 & 2 */}
                <g className="cursor-pointer" onClick={() => setActiveFloorLevel(1)}>
                  <rect x="620" y="60" width="100" height="120" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                  <text x="670" y="95" fill="#c7d2fe" fontSize="12" fontWeight="bold" textAnchor="middle">LIFT A</text>
                  <text x="670" y="115" fill="#a5b4fc" fontSize="10" textAnchor="middle">To Floors 1 & 2</text>
                  <path d="M 660 145 L 670 130 L 680 145" fill="none" stroke="#818cf8" strokeWidth="2" />
                </g>
                <g className="cursor-pointer" onClick={() => setActiveFloorLevel(2)}>
                  <rect x="740" y="60" width="100" height="120" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                  <text x="790" y="95" fill="#c7d2fe" fontSize="12" fontWeight="bold" textAnchor="middle">LIFT B</text>
                  <text x="790" y="115" fill="#a5b4fc" fontSize="10" textAnchor="middle">Ramp & Stretcher</text>
                  <path d="M 780 145 L 790 130 L 800 145" fill="none" stroke="#818cf8" strokeWidth="2" />
                </g>

                {/* ANIMATED WAYFINDING PATH LINES FOR GROUND FLOOR */}
                {/* 1. Red Line to Emergency */}
                <path 
                  d="M 450 320 L 450 240 L 170 240 L 170 180" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'EMER' ? '#ef4444' : '#ef444455'} 
                  strokeWidth={selectedDepartmentId === 'EMER' ? 5 : 2}
                  strokeDasharray="6 4"
                />
                {/* 2. Green Line to General Medicine */}
                <path 
                  d="M 450 320 L 450 240 L 280 240 L 280 300" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'GENMED' ? '#10b981' : '#10b98144'} 
                  strokeWidth={selectedDepartmentId === 'GENMED' ? 5 : 2}
                  strokeDasharray="6 4"
                />
                {/* 3. Cyan Line to Diagnostics */}
                <path 
                  d="M 450 320 L 450 180" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'RADIO' ? '#06b6d4' : '#06b6d444'} 
                  strokeWidth={selectedDepartmentId === 'RADIO' ? 5 : 2}
                  strokeDasharray="6 4"
                />
                {/* 4. Indigo Line to Lifts */}
                {(selectedDepartmentId === 'CARD' || selectedDepartmentId === 'PEDI' || selectedDepartmentId === 'ORTH' || selectedDepartmentId === 'GYN') && (
                  <path 
                    d="M 450 320 L 450 240 L 670 240 L 670 180" 
                    fill="none" 
                    stroke="#818cf8" 
                    strokeWidth={5}
                    strokeDasharray="6 4"
                  />
                )}
              </g>
            )}

            {/* =========================================================================
                LEVEL 1: FIRST FLOOR (CARDIOLOGY & PEDIATRICS)
               ========================================================================= */}
            {activeFloorLevel === 1 && (
              <g id="first-floor">
                {/* Corridor */}
                <rect x="180" y="200" width="540" height="80" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                <text x="450" y="245" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                  FIRST FLOOR MAIN CONCOURSE • LIFT A ARRIVAL
                </text>

                {/* Lift Arrival Lobby */}
                <rect x="620" y="60" width="100" height="120" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                <text x="670" y="100" fill="#c7d2fe" fontSize="12" fontWeight="bold" textAnchor="middle">LIFT A</text>
                <text x="670" y="125" fill="#a5b4fc" fontSize="10" textAnchor="middle">Floor 1 Concourse</text>

                {/* 1. Cardiology & Chest Clinic (Room 104) */}
                <g 
                  onClick={() => onSelectDepartment('CARD')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="60" width="240" height="120" rx="8" 
                    fill={selectedDepartmentId === 'CARD' ? '#1e3a8a' : '#0f172a'} 
                    stroke="#3b82f6" 
                    strokeWidth={selectedDepartmentId === 'CARD' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'CARD' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="75" width="26" height="26" rx="6" fill="#3b82f6" />
                  <text x="88" y="93" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">❤️</text>
                  <text x="115" y="88" fill="#60a5fa" fontSize="13" fontWeight="bold">CARDIOLOGY OPD</text>
                  <text x="115" y="106" fill="#bfdbfe" fontSize="11">Room 104 • Dr. Rajesh Mehta</text>
                  <text x="75" y="140" fill="#94a3b8" fontSize="10">ECG & Echo Lab • East Wing</text>
                  <text x="75" y="160" fill="#60a5fa" fontSize="10" fontWeight="bold">Follow Blue Floor Line</text>
                </g>

                {/* 2. Pediatrics & Child OPD (Room 112) */}
                <g 
                  onClick={() => onSelectDepartment('PEDI')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="240" width="240" height="120" rx="8" 
                    fill={selectedDepartmentId === 'PEDI' ? '#78350f' : '#0f172a'} 
                    stroke="#f59e0b" 
                    strokeWidth={selectedDepartmentId === 'PEDI' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'PEDI' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="255" width="26" height="26" rx="6" fill="#f59e0b" />
                  <text x="88" y="273" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">👶</text>
                  <text x="115" y="268" fill="#fbbf24" fontSize="13" fontWeight="bold">PEDIATRICS OPD</text>
                  <text x="115" y="286" fill="#fde68a" fontSize="11">Room 112 • Dr. Meenakshi Sundaram</text>
                  <text x="75" y="320" fill="#94a3b8" fontSize="10">Child Immunization Lounge • West Wing</text>
                  <text x="75" y="340" fill="#fbbf24" fontSize="10" fontWeight="bold">Follow Yellow Floor Line</text>
                </g>

                {/* Minor OT & Recovery Lounge */}
                <rect x="360" y="60" width="220" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="380" y="95" fill="#f8fafc" fontSize="13" fontWeight="bold">DAY SURGERY & MINOR OT</text>
                <text x="380" y="115" fill="#94a3b8" fontSize="11">Post-Procedure Recovery</text>
                <text x="380" y="145" fill="#cbd5e1" fontSize="10">Sterile Area • Authorized Staff</text>

                {/* Waiting Lounge */}
                <rect x="360" y="300" width="360" height="100" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <text x="540" y="345" fill="#cbd5e1" fontSize="12" fontWeight="bold" textAnchor="middle">
                  CENTRAL OPD WAITING HALL & DIGITAL TOKEN BOARD
                </text>
                <text x="540" y="365" fill="#94a3b8" fontSize="10" textAnchor="middle">
                  Wheelchair Accessible • Water & Restrooms Nearby
                </text>

                {/* WAYFINDING PATH LINES FOR FLOOR 1 */}
                {/* Route from Lift A to Cardiology */}
                <path 
                  d="M 670 180 L 670 240 L 180 240 L 180 180" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'CARD' ? '#3b82f6' : '#3b82f644'} 
                  strokeWidth={selectedDepartmentId === 'CARD' ? 5 : 2}
                  strokeDasharray="6 4"
                />
                {/* Route from Lift A to Pediatrics */}
                <path 
                  d="M 670 180 L 670 240 L 180 240 L 180 240 L 180 300" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'PEDI' ? '#f59e0b' : '#f59e0b44'} 
                  strokeWidth={selectedDepartmentId === 'PEDI' ? 5 : 2}
                  strokeDasharray="6 4"
                />
              </g>
            )}

            {/* =========================================================================
                LEVEL 2: SECOND FLOOR (ORTHOPEDICS & GYNECOLOGY)
               ========================================================================= */}
            {activeFloorLevel === 2 && (
              <g id="second-floor">
                {/* Corridor */}
                <rect x="180" y="200" width="540" height="80" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                <text x="450" y="245" fill="#64748b" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                  SECOND FLOOR CORRIDOR • ACCESSIBLE LIFT B
                </text>

                {/* Lift B Arrival Lobby */}
                <rect x="740" y="60" width="100" height="120" rx="8" fill="#312e81" stroke="#818cf8" strokeWidth="2" />
                <text x="790" y="100" fill="#c7d2fe" fontSize="12" fontWeight="bold" textAnchor="middle">LIFT B</text>
                <text x="790" y="125" fill="#a5b4fc" fontSize="10" textAnchor="middle">Stretcher & Ramp</text>

                {/* 1. Orthopedics & Joint Clinic (Room 204) */}
                <g 
                  onClick={() => onSelectDepartment('ORTH')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="60" width="240" height="120" rx="8" 
                    fill={selectedDepartmentId === 'ORTH' ? '#4c1d95' : '#0f172a'} 
                    stroke="#8b5cf6" 
                    strokeWidth={selectedDepartmentId === 'ORTH' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'ORTH' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="75" width="26" height="26" rx="6" fill="#8b5cf6" />
                  <text x="88" y="93" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">🦴</text>
                  <text x="115" y="88" fill="#a78bfa" fontSize="13" fontWeight="bold">ORTHOPEDICS OPD</text>
                  <text x="115" y="106" fill="#ddd6fe" fontSize="11">Room 204 • Dr. Arun Saxena</text>
                  <text x="75" y="140" fill="#94a3b8" fontSize="10">Fractures, Plaster Room & Joints</text>
                  <text x="75" y="160" fill="#a78bfa" fontSize="10" fontWeight="bold">Follow Purple Floor Line</text>
                </g>

                {/* 2. Obstetrics & Gynecology OPD (Room 215) */}
                <g 
                  onClick={() => onSelectDepartment('GYN')}
                  className="cursor-pointer transition-transform hover:opacity-90"
                >
                  <rect 
                    x="60" y="240" width="240" height="120" rx="8" 
                    fill={selectedDepartmentId === 'GYN' ? '#831843' : '#0f172a'} 
                    stroke="#ec4899" 
                    strokeWidth={selectedDepartmentId === 'GYN' ? '3' : '1.5'}
                    filter={selectedDepartmentId === 'GYN' ? 'url(#glow)' : undefined}
                  />
                  <rect x="75" y="255" width="26" height="26" rx="6" fill="#ec4899" />
                  <text x="88" y="273" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">🌸</text>
                  <text x="115" y="268" fill="#f472b6" fontSize="13" fontWeight="bold">GYNECOLOGY OPD</text>
                  <text x="115" y="286" fill="#fbcfe8" fontSize="11">Room 215 • Dr. Kavita Deshmukh</text>
                  <text x="75" y="320" fill="#94a3b8" fontSize="10">Antenatal & Maternal Welfare</text>
                  <text x="75" y="340" fill="#f472b6" fontSize="10" fontWeight="bold">Follow Pink Floor Line</text>
                </g>

                {/* Physiotherapy Rehabilitation Hall */}
                <rect x="360" y="60" width="220" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                <text x="380" y="95" fill="#f8fafc" fontSize="13" fontWeight="bold">PHYSIOTHERAPY REHAB</text>
                <text x="380" y="115" fill="#94a3b8" fontSize="11">Post-operative mobilization</text>
                <text x="380" y="145" fill="#cbd5e1" fontSize="10">Parallel Bars & Ultrasound Therapy</text>

                {/* WAYFINDING PATH LINES FOR FLOOR 2 */}
                {/* Route from Lift B to Orthopedics */}
                <path 
                  d="M 790 180 L 790 240 L 180 240 L 180 180" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'ORTH' ? '#8b5cf6' : '#8b5cf644'} 
                  strokeWidth={selectedDepartmentId === 'ORTH' ? 5 : 2}
                  strokeDasharray="6 4"
                />
                {/* Route from Lift B to Gynecology */}
                <path 
                  d="M 790 180 L 790 240 L 180 240 L 180 300" 
                  fill="none" 
                  stroke={selectedDepartmentId === 'GYN' ? '#ec4899' : '#ec489944'} 
                  strokeWidth={selectedDepartmentId === 'GYN' ? 5 : 2}
                  strokeDasharray="6 4"
                />
              </g>
            )}

            {/* Destination Pin Pulse Marker if on this floor */}
            {activeDept && (
              (activeFloorLevel === 0 && (activeDept.id === 'EMER' || activeDept.id === 'GENMED' || activeDept.id === 'RADIO')) ||
              (activeFloorLevel === 1 && (activeDept.id === 'CARD' || activeDept.id === 'PEDI')) ||
              (activeFloorLevel === 2 && (activeDept.id === 'ORTH' || activeDept.id === 'GYN'))
            ) && (
              <g>
                <circle
                  cx={
                    activeDept.id === 'EMER' ? 170 :
                    activeDept.id === 'GENMED' ? 170 :
                    activeDept.id === 'RADIO' ? 450 :
                    activeDept.id === 'CARD' ? 180 :
                    activeDept.id === 'PEDI' ? 180 :
                    activeDept.id === 'ORTH' ? 180 :
                    activeDept.id === 'GYN' ? 180 : 450
                  }
                  cy={
                    activeDept.id === 'EMER' ? 120 :
                    activeDept.id === 'GENMED' ? 300 :
                    activeDept.id === 'RADIO' ? 120 :
                    activeDept.id === 'CARD' ? 120 :
                    activeDept.id === 'PEDI' ? 300 :
                    activeDept.id === 'ORTH' ? 120 :
                    activeDept.id === 'GYN' ? 300 : 240
                  }
                  r="20"
                  fill="none"
                  stroke={activeDept.color || '#38bdf8'}
                  strokeWidth="3"
                  className="animate-ping"
                  opacity="0.8"
                />
                <circle
                  cx={
                    activeDept.id === 'EMER' ? 170 :
                    activeDept.id === 'GENMED' ? 170 :
                    activeDept.id === 'RADIO' ? 450 :
                    activeDept.id === 'CARD' ? 180 :
                    activeDept.id === 'PEDI' ? 180 :
                    activeDept.id === 'ORTH' ? 180 :
                    activeDept.id === 'GYN' ? 180 : 450
                  }
                  cy={
                    activeDept.id === 'EMER' ? 120 :
                    activeDept.id === 'GENMED' ? 300 :
                    activeDept.id === 'RADIO' ? 120 :
                    activeDept.id === 'CARD' ? 120 :
                    activeDept.id === 'PEDI' ? 300 :
                    activeDept.id === 'ORTH' ? 120 :
                    activeDept.id === 'GYN' ? 300 : 240
                  }
                  r="8"
                  fill={activeDept.color || '#38bdf8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
