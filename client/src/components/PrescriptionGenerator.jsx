import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  CheckCircle2, 
  Volume2, 
  AlertCircle, 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Pill,
  Activity,
  HeartPulse
} from 'lucide-react';
import { addPrescription } from '../services/db';
import { speakText } from '../services/speech';

export default function PrescriptionGenerator({
  patient = null,
  doctor = { id: 'DOC-101', name: 'Dr. Vikram Sharma', department: 'General Medicine', room: 'Room 101' },
  currentLang = 'en',
  t = {},
  darkMode = false,
  onClose = () => {},
  onSaved = () => {}
}) {
  const [formData, setFormData] = useState({
    tokenNumber: patient?.token_number || patient?.token || 'CARD-101',
    patientName: patient?.name || 'Ahmed Khan',
    age: patient?.age || 42,
    gender: patient?.gender || 'Male',
    department: patient?.department || doctor?.department || 'General Medicine',
    vitals: {
      bp: '120/80',
      pulse: '74',
      temp: '98.4 F',
      spo2: '99%',
      weight: '68 kg'
    },
    diagnosis: 'Acute Upper Respiratory Tract Infection',
    symptoms: 'Fever for 2 days, mild dry cough, throat irritation',
    medicines: [
      { id: 1, name: 'Paracetamol 650mg', dosage: '1 tablet', frequency: '1-0-1 (Twice daily)', duration: '3 days', notes: 'After food if fever > 100 F' },
      { id: 2, name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: '1-0-1 (Twice daily)', duration: '5 days', notes: 'Complete full course' },
      { id: 3, name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: '0-0-1 (Night only)', duration: '5 days', notes: 'May cause drowsiness' },
    ],
    testsOrdered: 'CBC, Chest X-Ray PA View if cough persists',
    advice: 'Drink warm water. Rest well for 3 days. Return immediately if high fever or breathing distress occurs.',
    followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '1 tablet',
    frequency: '1-0-1 (Twice daily)',
    duration: '5 days',
    notes: 'After food'
  });

  const isRtl = currentLang === 'ar';

  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return;
    setFormData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { ...newMed, id: Date.now() }
      ]
    }));
    setNewMed({
      name: '',
      dosage: '1 tablet',
      frequency: '1-0-1 (Twice daily)',
      duration: '5 days',
      notes: 'After food'
    });
  };

  const handleRemoveMedicine = (id) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id)
    }));
  };

  const handleSavePrescription = async () => {
    setSaving(true);
    try {
      const payload = {
        token_number: formData.tokenNumber,
        patient_name: formData.patientName,
        age: formData.age,
        gender: formData.gender,
        doctor_id: doctor.id || 'DOC-101',
        doctor_name: doctor.name || 'Dr. Vikram Sharma',
        department: formData.department,
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        vitals: formData.vitals,
        medicines: formData.medicines,
        tests_ordered: formData.testsOrdered,
        advice: formData.advice,
        follow_up_date: formData.followUpDate,
        date: new Date().toISOString()
      };

      const res = addPrescription(payload);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        onSaved(res.data);
      }
    } catch (err) {
      console.error('Error saving prescription:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReadPrescription = () => {
    const medSummary = formData.medicines.map(m => `${m.name}, ${m.frequency}`).join('. ');
    const speechText = `Prescription for ${formData.patientName}. Diagnosis: ${formData.diagnosis}. Prescribed medicines: ${medSummary}. Next follow up on ${formData.followUpDate}.`;
    speakText(speechText, currentLang);
  };

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Pill className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Digital Prescription Generator
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate, print, and save certified digital medical prescriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReadPrescription}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Read out prescription"
          >
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>Voice Read</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={handleSavePrescription}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Prescription</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Prescription Document Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Hospital Header Banner */}
        <div className="border-b-2 border-indigo-600 pb-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <HeartPulse className="w-7 h-7 text-indigo-600" />
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  OPD SHA HOSPITAL
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Smart Government Healthcare Center • ABDM Enabled
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Central OPD Block, Civil Lines, New Delhi • Tel: 1800-11-2024
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
                Rx #{formData.tokenNumber}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Date: {new Date().toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {doctor.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {doctor.department} • {doctor.room}
              </p>
            </div>
          </div>
        </div>

        {/* Patient & Vitals Information Box */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className="w-full font-bold text-slate-800 dark:text-white bg-transparent text-sm border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Age / Gender</span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-12 font-bold text-slate-800 dark:text-white bg-transparent text-sm border-b border-transparent hover:border-slate-300 focus:outline-none"
              />
              <span className="text-sm text-slate-400">Yrs /</span>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="font-bold text-slate-800 dark:text-white bg-transparent text-sm focus:outline-none"
              >
                <option value="Male" className="dark:bg-slate-900">Male</option>
                <option value="Female" className="dark:bg-slate-900">Female</option>
                <option value="Other" className="dark:bg-slate-900">Other</option>
              </select>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Token / OP ID</span>
            <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formData.tokenNumber}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
              {formData.department}
            </p>
          </div>
        </div>

        {/* Clinical Vitals Row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs mb-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">BP:</span>
            <input
              type="text"
              value={formData.vitals.bp}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bp: e.target.value } })}
              className="w-16 font-mono font-bold text-slate-800 dark:text-white bg-transparent border-b border-indigo-200 dark:border-indigo-800 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Pulse:</span>
            <input
              type="text"
              value={formData.vitals.pulse}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, pulse: e.target.value } })}
              className="w-12 font-mono font-bold text-slate-800 dark:text-white bg-transparent border-b border-indigo-200 dark:border-indigo-800 text-center"
            />
            <span className="text-slate-400">bpm</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">SpO2:</span>
            <input
              type="text"
              value={formData.vitals.spo2}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: e.target.value } })}
              className="w-12 font-mono font-bold text-slate-800 dark:text-white bg-transparent border-b border-indigo-200 dark:border-indigo-800 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Temp:</span>
            <input
              type="text"
              value={formData.vitals.temp}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temp: e.target.value } })}
              className="w-16 font-mono font-bold text-slate-800 dark:text-white bg-transparent border-b border-indigo-200 dark:border-indigo-800 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Weight:</span>
            <input
              type="text"
              value={formData.vitals.weight}
              onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, weight: e.target.value } })}
              className="w-14 font-mono font-bold text-slate-800 dark:text-white bg-transparent border-b border-indigo-200 dark:border-indigo-800 text-center"
            />
          </div>
        </div>

        {/* Diagnosis & Symptoms */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Clinical Diagnosis
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Chief Complaints & Symptoms
            </label>
            <textarea
              rows={2}
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Prescribed Medications Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 font-serif font-black text-2xl italic">Rx</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Prescribed Medicines
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {formData.medicines.length} medicine(s) prescribed
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Dosage</th>
                  <th className="py-2.5 px-3">Frequency</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Instructions</th>
                  <th className="py-2.5 px-3 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200 font-medium">
                {formData.medicines.map((med, idx) => (
                  <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{med.name}</td>
                    <td className="py-2.5 px-3">{med.dosage}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
                        {med.frequency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{med.duration}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{med.notes}</td>
                    <td className="py-2.5 px-3 text-center print:hidden">
                      <button
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Medicine Bar (Hidden on print) */}
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-2 print:hidden">
            <input
              type="text"
              placeholder="Medicine Name (e.g. Azithromycin 500mg)"
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Dosage (1 tab)"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              className="w-24 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Frequency (1-0-1)"
              value={newMed.frequency}
              onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
              className="w-32 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
            <input
              type="text"
              placeholder="Duration (5 days)"
              value={newMed.duration}
              onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
              className="w-28 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
            />
            <button
              onClick={handleAddMedicine}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Tests & General Advice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Lab Tests & Diagnostics Ordered
            </label>
            <textarea
              rows={2}
              value={formData.testsOrdered}
              onChange={(e) => setFormData({ ...formData, testsOrdered: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
              Doctor Advice & Dietary Guidelines
            </label>
            <textarea
              rows={2}
              value={formData.advice}
              onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Footer with Follow-up & Digital Signature */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Next Review / Follow-up Date:</span>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 max-w-sm">
              Note: This is a computer-generated digital prescription verified under the Ayushman Bharat Digital Health Mission (ABDM).
            </p>
          </div>

          <div className="text-center sm:text-right">
            <div className="inline-block border-b-2 border-slate-400 dark:border-slate-600 px-6 pb-1 mb-1 font-serif italic text-indigo-600 dark:text-indigo-400 font-bold">
              {doctor.name}
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-white">
              {doctor.name}
            </p>
            <p className="text-[11px] text-slate-400">
              Reg No: DMC/2018/84729 • OPD Consulting Physician
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
