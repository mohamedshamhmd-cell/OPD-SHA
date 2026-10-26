import React from 'react';
import { 
  Printer, 
  Navigation, 
  Volume2, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Building2, 
  User, 
  CreditCard,
  QrCode,
  Share2,
  Calendar,
  AlertCircle,
  Stethoscope,
  CalendarCheck
} from 'lucide-react';
import { speakText } from '../services/speech';

export default function OPDSlip({ 
  slipData = null, 
  onNavigateToTrack = () => {},
  currentLang = 'en',
  t = {}
}) {
  if (!slipData) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">No OPD Slip Available</h3>
        <p className="text-sm text-slate-500 mt-1">Please register first or enter an existing token to view your slip.</p>
      </div>
    );
  }

  const { slip } = slipData;
  const isEmergency = slip.patient.isEmergency;
  const isAppointment = slip.appointmentType === 'APPOINTMENT';

  const handleReadSlip = () => {
    let msg = '';
    const deptName = currentLang === 'hi' ? slip.department.hindiName : currentLang === 'ta' ? slip.department.tamilName : slip.department.name;
    const room = slip.doctor?.roomNumber || slip.department.roomNumber;
    const token = slip.tokenNumber;
    const doctor = slip.doctor?.name || slip.department.doctorInCharge;
    const slot = slip.slotTime ? `Appointment slot: ${slip.slotTime}. ` : '';
    const directions = currentLang === 'hi' ? slip.navigation.directionsHindi : currentLang === 'ta' ? slip.navigation.directionsTamil : slip.navigation.directionsText;

    switch (currentLang) {
      case 'ta':
        msg = `OPD சாதி மருத்துவமனை சீட்டு. டோக்கன் எண் ${token}. நோயாளி பெயர் ${slip.patient.name}. துறை ${deptName}. அறை எண் ${room}. மருத்துவர் ${doctor}. ${slot}${directions}`;
        break;
      case 'hi':
        msg = `ओपीडी साथी अस्पताल पर्ची। टोकन संख्या ${token}। रोगी का नाम ${slip.patient.name}। विभाग ${deptName}। कक्ष संख्या ${room}। डॉक्टर ${doctor}। ${slot}${directions}`;
        break;
      case 'te':
        msg = `ఓపీడీ సాథీ ఆసుపత్రి స్లిప్. టోకెన్ సంఖ్య ${token}. రోగి పేరు ${slip.patient.name}. విభాగం ${deptName}. గది సంఖ్య ${room}. డాక్టర్ ${doctor}. ${slot}${directions}`;
        break;
      case 'kn':
        msg = `ಒಪಿಡಿ ಸಾಥಿ ಆಸ್ಪತ್ರೆ ಚೀಟಿ. ಟೋಕನ್ ಸಂಖ್ಯೆ ${token}. ರೋಗಿಯ ಹೆಸರು ${slip.patient.name}. ವಿಭಾಗ ${deptName}. ಕೊಠಡಿ ಸಂಖ್ಯೆ ${room}. ವೈದ್ಯರು ${doctor}. ${slot}${directions}`;
        break;
      case 'ml':
        msg = `ഒപിഡി സാഥി ആശുപത്രി സ്ലിപ്പ്. ടോക്കൺ നമ്പർ ${token}. രോഗിയുടെ പേര് ${slip.patient.name}. വിഭാഗം ${deptName}. റൂം നമ്പർ ${room}. ഡോക്ടർ ${doctor}. ${slot}${directions}`;
        break;
      case 'bn':
        msg = `ওপিডি সাথি হাসপাতাল স্লিপ। টোকেন নম্বর ${token}। রোগীর নাম ${slip.patient.name}। বিভাগ ${deptName}। কক্ষ নম্বর ${room}। ডাক্তার ${doctor}। ${slot}${directions}`;
        break;
      case 'mr':
        msg = `ओपीडी साथी रुग्णालय पावती. टोकन क्रमांक ${token}. रुग्णाचे नाव ${slip.patient.name}. विभाग ${deptName}. खोली क्र. ${room}. डॉक्टर ${doctor}. ${slot}${directions}`;
        break;
      default:
        msg = `OPD SHAATHI Hospital Slip. Token Number ${token}. Patient ${slip.patient.name}. Department ${deptName}. Assigned Room ${room}. Consulting Doctor ${doctor}. ${slot}Directions: ${directions}`;
        break;
    }

    speakText(msg, currentLang);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Action Bar (hidden in print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={handleReadSlip}
          className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
        >
          <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{t.slip?.listenSlip || '🔊 Read Slip Out Loud'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{t.slip?.printSlip || '🖨️ Print Slip'}</span>
          </button>

          <button
            onClick={() => onNavigateToTrack(slip.tokenNumber)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>{t.slip?.proceedToQueue || '🗺️ Live Queue & Directions'}</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE OFFICIAL OPD SLIP CARD */}
      <div 
        id="printable-slip"
        className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl border-2 border-slate-300 shadow-lg relative overflow-hidden print:border-none print:shadow-none print:p-0"
      >
        {/* Hospital Branding Header */}
        <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">🏥</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-indigo-950">
                {t.hospitalName || 'OPD SHAATHI HOSPITAL'}
              </h2>
              <p className="text-xs text-slate-600 font-semibold tracking-wide">
                {t.slip?.ministry || 'Ministry of Health & Family Welfare • National Smart Hospital Initiative'}
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-4 mt-2">
            <span>Ayushman Bharat ABDM Connected</span>
            <span>•</span>
            <span>Smart Queue Management</span>
            <span>•</span>
            <span>NABH Accredited</span>
          </div>
        </div>

        {/* EMERGENCY WATERMARK BANNER IF EMERGENCY */}
        {isEmergency ? (
          <div className="mb-6 p-4 rounded-2xl bg-red-600 text-white flex items-center justify-between gap-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 shrink-0 text-white" />
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-200">
                  RED TRIAGE CODE
                </span>
                <h4 className="text-base sm:text-lg font-black leading-tight">
                  CRITICAL EMERGENCY • IMMEDIATE TRAUMA CARE
                </h4>
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-red-700 font-black text-xs rounded-lg uppercase">
              ZERO WAIT
            </span>
          </div>
        ) : isAppointment ? (
          <div className="mb-6 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-teal-600" />
              <span>Confirmed Token Appointment Slot: {slip.slotTime}</span>
            </span>
            <span className="font-mono text-[11px] text-teal-600">ABDM: {slip.patient.govtId}</span>
          </div>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
            <span className="font-semibold">General Outpatient Department (OPD) Walk-In Slip</span>
            <span className="font-mono text-[11px] text-slate-500">ABDM: {slip.patient.govtId}</span>
          </div>
        )}

        {/* TOKEN BANNER & QR CODE */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {t.slip?.tokenLabel || 'TOKEN NUMBER'}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-1 font-mono">
              {slip.tokenNumber}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(slip.patient.createdAt).toLocaleDateString()} at {new Date(slip.patient.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Barcode / QR Simulation */}
          <div className="flex items-center gap-3 self-center sm:self-auto bg-slate-800 p-3 rounded-xl border border-slate-700">
            <QrCode className="w-14 h-14 text-white" />
            <div className="text-[10px] font-mono text-slate-300 leading-tight">
              <div className="font-bold text-indigo-400">{slip.tokenNumber}</div>
              <div>ID: {slip.patient.govtId}</div>
              <div className="text-[9px] text-slate-400 mt-1">{t.slip?.barcodeText || 'SCAN AT ROOM KIOSK'}</div>
            </div>
          </div>
        </div>

        {/* PATIENT & DEPARTMENT DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
          {/* Patient Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {t.slip?.patientDetails || 'Patient Information'}
            </h4>
            <div>
              <span className="text-xs text-slate-500 block">Name:</span>
              <span className="font-bold text-base text-slate-900">{slip.patient.name}</span>
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-slate-500 block">Age / Gender:</span>
                <span className="font-semibold text-sm text-slate-800">{slip.patient.age} Yrs • {slip.patient.gender}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Priority:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  isEmergency ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {slip.patient.triageLevel}
                </span>
              </div>
            </div>
            {slip.patient.contact && (
              <div>
                <span className="text-xs text-slate-500 block">Mobile:</span>
                <span className="font-mono text-xs text-slate-800">{slip.patient.contact}</span>
              </div>
            )}
          </div>

          {/* Department & Doctor Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              {t.slip?.departmentDetails || 'Department & Consulting Doctor'}
            </h4>
            <div>
              <span className="text-xs text-slate-500 block">Clinical Department:</span>
              <span className="font-bold text-base text-indigo-900">
                {currentLang === 'hi' ? slip.department.hindiName : currentLang === 'ta' ? slip.department.tamilName : slip.department.name}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">{t.slip?.doctorLabel || 'Consulting Doctor'}:</span>
              <span className="font-bold text-sm text-slate-900 block">
                {slip.doctor?.name || slip.department.doctorInCharge}
              </span>
              {slip.doctor?.qualification && (
                <span className="text-[11px] text-slate-500 block">{slip.doctor.qualification} ({slip.doctor.designation})</span>
              )}
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-xs text-slate-500 block">{t.slip?.roomLabel || 'Assigned Room'}:</span>
                <span className="font-black text-sm text-slate-900 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                  {slip.doctor?.roomNumber || slip.department.roomNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">{t.slip?.floorLabel || 'Floor'}:</span>
                <span className="font-semibold text-sm text-slate-800">{slip.floor.name} ({slip.ward.wing})</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP-BY-STEP WAYFINDING DIRECTIONS */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Slip-to-Destination Walking Guidance:</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            {currentLang === 'hi' 
              ? slip.navigation.directionsHindi 
              : currentLang === 'ta' 
                ? slip.navigation.directionsTamil 
                : slip.navigation.directionsText}
          </p>
          <div className="text-[11px] text-indigo-600 font-semibold pt-1">
            📍 Landmark: {slip.department.landmark}
          </div>
        </div>

        {/* Queue Status Notice */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>
              {isEmergency 
                ? 'EMERGENCY PROTOCOL: Zero wait. Doctor alerted.' 
                : isAppointment
                  ? `Slot Confirmed: ${slip.slotTime} (Queue Position: #${slip.queue.position})`
                  : `Initial Queue Position: #${slip.queue.position} (~${slip.queue.estimatedWaitMins} mins wait)`}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 text-center sm:text-right">
            {t.slip?.notice || 'Please preserve this digital slip. Present this token at the OPD Room entrance.'}
          </p>
        </div>
      </div>
    </div>
  );
}
