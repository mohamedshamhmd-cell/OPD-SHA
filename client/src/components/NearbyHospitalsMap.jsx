import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin, Stethoscope, Clock, BedDouble, Phone,
  ShieldAlert, CheckCircle2, XCircle, RefreshCw,
  ChevronRight, Building2, Navigation, Star
} from 'lucide-react';

// ─── Mock Nearby Government Hospitals ─────────────────────────────────────────
// Positions are offset from the user's detected location so they appear nearby.
function buildMockHospitals(lat, lng) {
  return [
    {
      id: 'H1',
      name: 'Government General Hospital',
      nameHi: 'सरकारी सामान्य अस्पताल',
      nameTa: 'அரசு பொது மருத்துவமனை',
      lat: lat + 0.009,
      lng: lng + 0.013,
      distance: '1.4 km',
      type: 'Government',
      phone: '044-2530 5000',
      beds: { total: 600, available: 48 },
      emergency: true,
      rating: 4.2,
      doctors: [
        { name: 'Dr. Sunita Rao',      spec: 'General Medicine', specHi: 'सामान्य चिकित्सा',    specTa: 'பொது மருத்துவம்',   available: true,  wait: '12 min' },
        { name: 'Dr. Arun Kumar',      spec: 'Cardiology',       specHi: 'हृदय रोग',            specTa: 'இதயவியல்',          available: true,  wait: '25 min' },
        { name: 'Dr. Meena Patel',     spec: 'Pediatrics',       specHi: 'बाल रोग',             specTa: 'குழந்தை நலம்',      available: false, wait: '50 min' },
        { name: 'Dr. Rajesh Sharma',   spec: 'Orthopedics',      specHi: 'हड्डी रोग',           specTa: 'எலும்பியல்',        available: true,  wait: '35 min' },
        { name: 'Dr. Priya Menon',     spec: 'Gynecology',       specHi: 'स्त्री रोग',          specTa: 'மகளிர் நலம்',      available: true,  wait: '20 min' },
      ]
    },
    {
      id: 'H2',
      name: 'District Primary Health Centre',
      nameHi: 'जिला प्राथमिक स्वास्थ्य केंद्र',
      nameTa: 'மாவட்ட முதன்மை சுகாதார மையம்',
      lat: lat - 0.005,
      lng: lng + 0.018,
      distance: '2.1 km',
      type: 'PHC',
      phone: '044-2430 1122',
      beds: { total: 80, available: 12 },
      emergency: false,
      rating: 3.8,
      doctors: [
        { name: 'Dr. Kavitha Nair',    spec: 'General Medicine', specHi: 'सामान्य चिकित्सा',    specTa: 'பொது மருத்துவம்',   available: true,  wait: '8 min'  },
        { name: 'Dr. Suresh Pillai',   spec: 'ENT',              specHi: 'कान-नाक-गला',         specTa: 'காது-மூக்கு-தொண்டை', available: true,  wait: '15 min' },
        { name: 'Dr. Anitha Devi',     spec: 'Dermatology',      specHi: 'त्वचा रोग',           specTa: 'தோல் மருத்துவம்',   available: false, wait: '40 min' },
      ]
    },
    {
      id: 'H3',
      name: 'Government ESI Hospital',
      nameHi: 'सरकारी ईएसआई अस्पताल',
      nameTa: 'அரசு ESI மருத்துவமனை',
      lat: lat + 0.014,
      lng: lng - 0.009,
      distance: '1.9 km',
      type: 'Government',
      phone: '044-2678 9000',
      beds: { total: 350, available: 5 },
      emergency: true,
      rating: 4.0,
      doctors: [
        { name: 'Dr. Venkatesh R.',    spec: 'Neurology',        specHi: 'तंत्रिका विज्ञान',    specTa: 'நரம்பியல்',         available: true,  wait: '45 min' },
        { name: 'Dr. Lakshmi Iyer',    spec: 'Oncology',         specHi: 'कैंसर रोग',           specTa: 'புற்றுநோயியல்',     available: false, wait: '60 min' },
        { name: 'Dr. Mohammed Ali',    spec: 'Urology',          specHi: 'मूत्र रोग',           specTa: 'சிறுநீரியல்',       available: true,  wait: '30 min' },
        { name: 'Dr. Divya Krishnan',  spec: 'Endocrinology',    specHi: 'अंतःस्रावी रोग',      specTa: 'நாளமில்லா சுரப்பியல்', available: true, wait: '20 min' },
      ]
    },
    {
      id: 'H4',
      name: 'Taluk Community Health Centre',
      nameHi: 'तालुका सामुदायिक स्वास्थ्य केंद्र',
      nameTa: 'வட்டார சமூக சுகாதார மையம்',
      lat: lat - 0.011,
      lng: lng - 0.015,
      distance: '2.8 km',
      type: 'CHC',
      phone: '044-2312 4567',
      beds: { total: 30, available: 18 },
      emergency: false,
      rating: 3.5,
      doctors: [
        { name: 'Dr. Selvi Arumugam',  spec: 'General Medicine', specHi: 'सामान्य चिकित्सा',    specTa: 'பொது மருத்துவம்',   available: true,  wait: '5 min'  },
        { name: 'Dr. Balan Murugan',   spec: 'Psychiatry',       specHi: 'मनोरोग',              specTa: 'மனநல மருத்துவம்',  available: true,  wait: '10 min' },
      ]
    },
    {
      id: 'H5',
      name: 'Government Ayurveda Hospital',
      nameHi: 'सरकारी आयुर्वेद अस्पताल',
      nameTa: 'அரசு ஆயுர்வேத மருத்துவமனை',
      lat: lat + 0.003,
      lng: lng - 0.021,
      distance: '3.2 km',
      type: 'Ayurveda',
      phone: '044-2214 5678',
      beds: { total: 50, available: 22 },
      emergency: false,
      rating: 4.4,
      doctors: [
        { name: 'Dr. Geetha Krishnan', spec: 'Ayurveda',         specHi: 'आयुर्वेद',            specTa: 'ஆயுர்வேதம்',       available: true,  wait: '10 min' },
        { name: 'Dr. Ravi Shankar',    spec: 'Naturopathy',      specHi: 'प्राकृतिक चिकित्सा', specTa: 'இயற்கை மருத்துவம்', available: true, wait: '15 min' },
      ]
    },
    {
      id: 'H6',
      name: 'Urban Health Post',
      nameHi: 'शहरी स्वास्थ्य केंद्र',
      nameTa: 'நகர்ப்புற சுகாதார கேந்திரம்',
      lat: lat + 0.017,
      lng: lng + 0.022,
      distance: '3.7 km',
      type: 'UHP',
      phone: '044-2895 1234',
      beds: { total: 15, available: 9 },
      emergency: false,
      rating: 3.6,
      doctors: [
        { name: 'Dr. Nirmala Doss',    spec: 'General Medicine', specHi: 'सामान्य चिकित्सा',    specTa: 'பொது மருத்துவம்',   available: true,  wait: '3 min'  },
        { name: 'Dr. Joseph Thomas',   spec: 'Ophthalmology',    specHi: 'नेत्र रोग',           specTa: 'கண் மருத்துவம்',    available: false, wait: '35 min' },
      ]
    },
  ];
}

// ─── Availability Colour Logic ──────────────────────────────────────────────
function getAvailabilityColor(hospital) {
  const available = hospital.doctors.filter(d => d.available).length;
  const total = hospital.doctors.length;
  const bedRatio = hospital.beds.available / hospital.beds.total;
  if (available === 0 || bedRatio < 0.05) return { marker: '#ef4444', badge: 'bg-red-100 text-red-700',   label: 'Full' };
  if (available < total / 2 || bedRatio < 0.15) return { marker: '#f59e0b', badge: 'bg-amber-100 text-amber-700', label: 'Limited' };
  return { marker: '#10b981', badge: 'bg-emerald-100 text-emerald-700', label: 'Available' };
}

// ─── Leaflet CDN Loader ─────────────────────────────────────────────────────
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

// ─── SVG Marker Generator ───────────────────────────────────────────────────
function makeMarkerIcon(L, color, isUser = false) {
  const svg = isUser
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="14" fill="#6366f1" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="5" fill="white"/>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
        <path d="M16 2 C8.3 2 2 8.3 2 16 C2 26 16 40 16 40 C16 40 30 26 30 16 C30 8.3 23.7 2 16 2Z"
              fill="${color}" stroke="white" stroke-width="2.5"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">🏥</text>
      </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: isUser ? [32, 32] : [32, 42],
    iconAnchor: isUser ? [16, 16] : [16, 42],
    popupAnchor: [0, -40],
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NearbyHospitalsMap({ currentLang = 'en', t = {} }) {
  const mapRef       = useRef(null);   // DOM container div
  const leafletMap   = useRef(null);   // L.Map instance
  const markersRef   = useRef([]);

  const [hospitals,      setHospitals]      = useState([]);
  const [selectedHosp,   setSelectedHosp]   = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting'); // 'detecting' | 'ok' | 'denied'
  const [filterType,     setFilterType]     = useState('ALL');

  const nearby = t.nearby || {};

  // ── Labels (fall back to English) ──────────────────────────────────────
  const L_TITLE         = nearby.title         || 'Nearby Government Hospitals & Doctors';
  const L_SUBTITLE      = nearby.subtitle      || 'Live availability, doctor specialisations and bed status near you.';
  const L_DETECTING     = nearby.detecting     || 'Detecting your location…';
  const L_DENIED        = nearby.denied        || 'Location access denied. Showing default area.';
  const L_AVAILABLE     = nearby.available     || 'Available';
  const L_DOCTORS       = nearby.doctors       || 'Doctors';
  const L_BEDS          = nearby.beds          || 'Beds Free';
  const L_EMERGENCY     = nearby.emergency     || '24×7 Emergency';
  const L_NO_EMERGENCY  = nearby.noEmergency   || 'No Emergency';
  const L_WAIT          = nearby.wait          || 'Wait';
  const L_FILTER        = nearby.filter        || 'Filter:';
  const L_ALL           = nearby.all           || 'All';
  const L_OPEN_MAP      = nearby.openMap       || 'Open in Maps';

  const TYPE_LABELS = { ALL: L_ALL, Government: 'Govt', PHC: 'PHC', CHC: 'CHC', Ayurveda: 'Ayurveda', UHP: 'UHP' };

  // ── Helpers ──────────────────────────────────────────────────────────
  const hospName = (h) =>
    currentLang === 'hi' ? h.nameHi : currentLang === 'ta' ? h.nameTa : h.name;

  const specLabel = (d) =>
    currentLang === 'hi' ? d.specHi : currentLang === 'ta' ? d.specTa : d.spec;

  // ── Initialise map ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      // Destroy previous map instance if it exists (React StrictMode / HMR)
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }

      // Default to Chennai centre if geolocation unavailable
      let userLat = 13.0827;
      let userLng = 80.2707;

      try {
        await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { userLat = pos.coords.latitude; userLng = pos.coords.longitude; res(); },
            (err) => rej(err),
            { timeout: 8000 }
          );
        });
        if (!cancelled) setLocationStatus('ok');
      } catch {
        if (!cancelled) setLocationStatus('denied');
      }

      const hosps = buildMockHospitals(userLat, userLng);
      if (!cancelled) setHospitals(hosps);

      // Create map
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // User location marker
      const userMarker = L.marker([userLat, userLng], {
        icon: makeMarkerIcon(L, '#6366f1', true),
        zIndexOffset: 1000,
      }).addTo(map);
      userMarker.bindPopup(
        `<div style="font-weight:700;font-size:13px;color:#4f46e5">📍 Your Location</div>`
      );

      // Accuracy circle
      L.circle([userLat, userLng], {
        radius: 300,
        color: '#6366f1',
        fillColor: '#6366f1',
        fillOpacity: 0.08,
        weight: 1.5,
      }).addTo(map);

      // Hospital markers
      markersRef.current = hosps.map((h) => {
        const col = getAvailabilityColor(h);
        const avail = h.doctors.filter(d => d.available).length;
        const marker = L.marker([h.lat, h.lng], {
          icon: makeMarkerIcon(L, col.marker),
        }).addTo(map);

        // Popup HTML
        const docRows = h.doctors.map(d =>
          `<tr>
            <td style="padding:3px 6px 3px 0;font-size:12px;color:#374151">${d.name}</td>
            <td style="padding:3px 6px;font-size:11px;color:#6b7280">${d.spec}</td>
            <td style="padding:3px 0;font-size:11px;font-weight:600;color:${d.available ? '#059669' : '#9ca3af'}">
              ${d.available ? `✓ ${d.wait}` : 'Busy'}
            </td>
          </tr>`
        ).join('');

        marker.bindPopup(
          `<div style="min-width:280px;font-family:system-ui,sans-serif">
            <div style="background:#1e1b4b;color:white;padding:10px 12px;border-radius:8px 8px 0 0;margin:-12px -12px 8px -12px">
              <div style="font-size:11px;font-weight:600;opacity:0.7;text-transform:uppercase;letter-spacing:0.05em">
                ${h.type} • ${h.distance} away
              </div>
              <div style="font-size:15px;font-weight:800;margin-top:2px">${h.name}</div>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
              <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:${col.marker}22;color:${col.marker}">
                ${avail}/${h.doctors.length} Doctors Available
              </span>
              <span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#f3f4f6;color:#374151">
                🛏 ${h.beds.available}/${h.beds.total} Beds
              </span>
              ${h.emergency ? `<span style="padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#fee2e2;color:#dc2626">🚨 24×7 Emergency</span>` : ''}
            </div>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="border-bottom:1px solid #e5e7eb">
                  <th style="text-align:left;padding:3px 6px 3px 0;font-size:11px;color:#9ca3af">Doctor</th>
                  <th style="text-align:left;padding:3px 6px;font-size:11px;color:#9ca3af">Specialisation</th>
                  <th style="text-align:left;padding:3px 0;font-size:11px;color:#9ca3af">Status</th>
                </tr>
              </thead>
              <tbody>${docRows}</tbody>
            </table>
            <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:11px;color:#6b7280">📞 ${h.phone}</span>
              <span style="font-size:11px;color:#4f46e5;font-weight:600">⭐ ${h.rating}/5.0</span>
            </div>
          </div>`,
          { maxWidth: 360 }
        );

        marker.on('click', () => {
          if (!cancelled) setSelectedHosp(h);
        });

        return { marker, hospitalId: h.id };
      });

      // Fit map to show all hospitals + user location
      const allPoints = [[userLat, userLng], ...hosps.map(h => [h.lat, h.lng])];
      map.fitBounds(allPoints, { padding: [40, 40] });
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Filtered hospital list ────────────────────────────────────────────
  const filtered = hospitals.filter(h => filterType === 'ALL' || h.type === filterType);
  const types    = ['ALL', ...new Set(hospitals.map(h => h.type))];

  // ── Focus map on a hospital ───────────────────────────────────────────
  const focusHospital = (h) => {
    setSelectedHosp(h);
    if (leafletMap.current) {
      leafletMap.current.setView([h.lat, h.lng], 16, { animate: true });
      const m = markersRef.current.find(m => m.hospitalId === h.id);
      if (m) m.marker.openPopup();
    }
  };

  // ── Refresh (re-detect location) ──────────────────────────────────────
  const handleRefresh = () => {
    setLocationStatus('detecting');
    setSelectedHosp(null);
    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }
    markersRef.current = [];
    // Re-trigger the useEffect by unmounting — handled via key; for simplicity reload
    window.location.reload(); // small UX tradeoff to keep code clean
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-2">
              <Navigation className="w-3.5 h-3.5 text-teal-200" />
              <span>Live Hospital Finder</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{L_TITLE}</h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">{L_SUBTITLE}</p>
          </div>

          {/* Location status badge */}
          <div className={`self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
            locationStatus === 'ok'
              ? 'bg-emerald-600/40 border-emerald-500/40 text-emerald-100'
              : locationStatus === 'denied'
                ? 'bg-amber-600/30 border-amber-500/40 text-amber-100'
                : 'bg-white/10 border-white/20 text-white'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              locationStatus === 'ok' ? 'bg-emerald-400 animate-pulse'
              : locationStatus === 'denied' ? 'bg-amber-400'
              : 'bg-white animate-ping'
            }`} />
            <span>
              {locationStatus === 'ok'    ? '📍 Location Detected'
               : locationStatus === 'denied' ? L_DENIED
               : L_DETECTING}
            </span>
            <button onClick={handleRefresh} className="ml-1 opacity-70 hover:opacity-100">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold px-1">
        <span className="text-slate-500">Availability Legend:</span>
        {[
          { color: 'bg-emerald-500', label: 'Good Availability' },
          { color: 'bg-amber-500',   label: 'Limited Availability' },
          { color: 'bg-red-500',     label: 'Full / No Doctors' },
          { color: 'bg-indigo-500',  label: 'Your Location' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-slate-600 dark:text-slate-400">{l.label}</span>
          </span>
        ))}
      </div>

      {/* Map + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT: Map ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div
            ref={mapRef}
            style={{ height: '520px', width: '100%', borderRadius: 'inherit' }}
          />
        </div>

        {/* ── RIGHT: Hospital List Panel ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">

          {/* Filter bar */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{L_FILTER}</span>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterType === type
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {TYPE_LABELS[type] || type}
              </button>
            ))}
          </div>

          {/* Scrollable hospital cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800" style={{ maxHeight: 460 }}>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Detecting hospitals near you…
              </div>
            )}
            {filtered.map(h => {
              const col   = getAvailabilityColor(h);
              const avail = h.doctors.filter(d => d.available).length;
              const isSel = selectedHosp?.id === h.id;

              return (
                <button
                  key={h.id}
                  onClick={() => focusHospital(h)}
                  className={`w-full text-left p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                    isSel ? 'bg-teal-50 dark:bg-teal-950/30 border-l-4 border-teal-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.badge}`}>
                          {col.label}
                        </span>
                        {h.emergency && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                            🚨 ER
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">
                        {hospName(h)}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {h.type} • {h.distance} • ⭐ {h.rating}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${isSel ? 'text-teal-600' : 'text-slate-300'}`} />
                  </div>

                  {/* Quick stats */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-teal-500" />
                      {avail}/{h.doctors.length} {L_DOCTORS}
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3 h-3 text-indigo-400" />
                      {h.beds.available} {L_BEDS}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Selected Hospital Detail Card ── */}
      {selectedHosp && (() => {
        const col   = getAvailabilityColor(selectedHosp);
        const avail = selectedHosp.doctors.filter(d => d.available).length;
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            {/* Hospital header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                    {col.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {selectedHosp.type}
                  </span>
                  {selectedHosp.emergency && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      🚨 {L_EMERGENCY}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {hospName(selectedHosp)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedHosp.distance} from you
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedHosp.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    {selectedHosp.rating}/5.0
                  </span>
                </p>
              </div>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl px-4 py-3 text-center">
                  <div className="text-2xl font-black text-teal-700 dark:text-teal-400">
                    {avail}<span className="text-base font-semibold text-teal-400">/{selectedHosp.doctors.length}</span>
                  </div>
                  <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">{L_DOCTORS}</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-4 py-3 text-center">
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                    {selectedHosp.beds.available}
                    <span className="text-base font-semibold text-indigo-400">/{selectedHosp.beds.total}</span>
                  </div>
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{L_BEDS}</div>
                </div>
              </div>
            </div>

            {/* Doctor specialisation table */}
            <div className="mt-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
                Doctors & Specialisations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedHosp.doctors.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-2xl border ${
                      d.available
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      d.available
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{specLabel(d)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {d.available ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-[11px] font-bold text-emerald-600">
                              {L_AVAILABLE} • {L_WAIT} ~{d.wait}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-400">
                              Busy • {L_WAIT} ~{d.wait}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedHosp.lat},${selectedHosp.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {L_OPEN_MAP}
              </a>
              <a
                href={`tel:${selectedHosp.phone.replace(/[^0-9]/g, '')}`}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Hospital
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
