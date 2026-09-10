import { useState, useRef, useEffect } from 'react';
import { X, Upload, Plus, Trash2, FileText, AlertCircle, Check } from 'lucide-react';

const ROUTES = [
  { id: 'UNASSIGNED', name: 'Unassigned', color: 'gray' },
  { id: 'LANGGAM', name: 'Langgam', color: 'blue' },
  { id: 'VILLAROSA', name: 'Villarosa', color: 'emerald' },
  { id: 'BAYAN-BAYANAN', name: 'Bayan-Bayanan', color: 'purple' },
  { id: 'ESTRELLA', name: 'Estrella', color: 'orange' },
  { id: 'CALAMBA', name: 'Calamba', color: 'red' },
];

const STATUSES = ['Available', 'In Maintenance', 'Out of Service'];
const VEHICLE_TYPES = ['Traditional Jeepney', 'Modern PUV', 'Van', 'Bus', 'Other'];
const DOC_TYPES = ['Registration', 'Franchise', 'Insurance', 'LTFRB Permit', 'Other'];

export default function AddUnitModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    plateNumber: '', unitNumber: '', type: 'Modern PUV', makeModel: '',
    year: new Date().getFullYear(), capacity: 15, engineNo: '', chassisNo: '', color: '',
    franchiseNo: '', ltfrbCaseNo: '', registrationIssueDate: '', registrationExpiryDate: '',
    insuranceProvider: '', insurancePolicyNo: '', insuranceExpiryDate: '',
    route: 'UNASSIGNED', status: 'Available', dateAcquired: '', acquisitionCost: '', notes: ''
  });

  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        plateNumber: '', unitNumber: '', type: 'Modern PUV', makeModel: '',
        year: new Date().getFullYear(), capacity: 15, engineNo: '', chassisNo: '', color: '',
        franchiseNo: '', ltfrbCaseNo: '', registrationIssueDate: '', registrationExpiryDate: '',
        insuranceProvider: '', insurancePolicyNo: '', insuranceExpiryDate: '',
        route: 'UNASSIGNED', status: 'Available', dateAcquired: '', acquisitionCost: '', notes: ''
      });
      setErrors({});
      setPhotoPreview(null);
      setDocuments([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file, name: file.name, type: 'Registration', expiryDate: ''
    }));
    setDocuments(prev => [...prev, ...newDocs]);
  };

  const removeDoc = (id) => setDocuments(prev => prev.filter(doc => doc.id !== id));
  const updateDoc = (id, field, value) => setDocuments(prev => prev.map(doc => doc.id === id ? { ...doc, [field]: value } : doc));

  const validate = () => {
    const newErrors = {};
    if (!formData.plateNumber) newErrors.plateNumber = 'Plate number is required';
    else if (!/^[A-Z0-9-]{3,8}$/i.test(formData.plateNumber)) newErrors.plateNumber = 'Format: ABC-1234';
    
    if (!formData.unitNumber) newErrors.unitNumber = 'Unit number is required';
    if (!formData.franchiseNo) newErrors.franchiseNo = 'Franchise number is required';
    if (formData.capacity < 1 || formData.capacity > 100) newErrors.capacity = 'Capacity must be 1-100';
    
    if (formData.registrationIssueDate && formData.registrationExpiryDate) {
      if (new Date(formData.registrationExpiryDate) <= new Date(formData.registrationIssueDate)) {
        newErrors.registrationExpiryDate = 'Expiry must be after issue date';
      }
    }
    
    if (formData.insuranceExpiryDate && new Date(formData.insuranceExpiryDate) <= new Date()) {
      newErrors.insuranceExpiryDate = 'Insurance must not be expired';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, addAnother = false) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const makeModelParts = formData.makeModel.split(' ');
    const make = makeModelParts[0] || '';
    const model = makeModelParts.slice(1).join(' ') || '';
    
    const newUnit = {
      id: `UNT-${new Date().getFullYear()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`,
      plateNumber: formData.plateNumber.toUpperCase(),
      unitNumber: formData.unitNumber,
      make: make || 'Unknown',
      model: model || 'Unknown',
      year: formData.year.toString(),
      type: formData.type,
      status: formData.status,
      route: formData.route,
      routeColor: ROUTES.find(r => r.id === formData.route)?.color || 'gray',
      franchiseNo: formData.franchiseNo,
      registrationExpiry: formData.registrationExpiryDate || '2025-12-31'
    };
    
    onSave(newUnit);
    
    if (addAnother) {
      setFormData({
        plateNumber: '', unitNumber: '', type: 'Modern PUV', makeModel: '',
        year: new Date().getFullYear(), capacity: 15, engineNo: '', chassisNo: '', color: '',
        franchiseNo: '', ltfrbCaseNo: '', registrationIssueDate: '', registrationExpiryDate: '',
        insuranceProvider: '', insurancePolicyNo: '', insuranceExpiryDate: '',
        route: 'UNASSIGNED', status: 'Available', dateAcquired: '', acquisitionCost: '', notes: ''
      });
      setErrors({});
      setPhotoPreview(null);
      setDocuments([]);
      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
      onClose();
    }
  };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <form onSubmit={(e) => handleSubmit(e, false)} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add New Unit</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a new vehicle to the cooperative fleet</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          <div className="max-w-4xl mx-auto">
            
<div className="space-y-8">
              
              {/* Section 1: Vehicle Info */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Vehicle Information</h3>
                
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photo Upload */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col items-center">
                    <label className="block text-xs font-semibold text-slate-700 mb-2 self-start">Unit Photo</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors group mb-2 relative overflow-hidden ${photoPreview ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-blue-400 hover:text-blue-500'}`}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium">Upload</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    {photoPreview ? (
                      <button type="button" onClick={() => setPhotoPreview(null)} className="text-[11px] text-red-600 font-medium w-full text-center hover:underline">Remove Photo</button>
                    ) : (
                      <p className="text-[10px] text-center text-slate-500">JPG or PNG (16:9)</p>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Plate Number *</label>
                    <input 
                      required type="text" name="plateNumber" value={formData.plateNumber} onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.plateNumber ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 bg-white text-slate-900 uppercase`} 
                      placeholder="e.g. ABC-1234" 
                    />
                    {errors.plateNumber && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.plateNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Body Number *</label>
                    <input 
                      required type="text" name="unitNumber" value={formData.unitNumber} onChange={handleChange}
                      className={`w-full px-3 py-2 border ${errors.unitNumber ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 bg-white text-slate-900`} 
                      placeholder="Internal ID" 
                    />
                    {errors.unitNumber && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.unitNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900">
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Make & Model</label>
                    <input name="makeModel" value={formData.makeModel} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="e.g. Toyota Tamaraw" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Year Model</label>
                    <input name="year" type="number" value={formData.year} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity *</label>
                    <input required name="capacity" type="number" value={formData.capacity} onChange={handleChange} className={`w-full px-3 py-2 border ${errors.capacity ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 bg-white text-slate-900`} />
                    {errors.capacity && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.capacity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                    <input name="color" value={formData.color} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="e.g. White" />
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Engine Number</label>
                    <input name="engineNo" value={formData.engineNo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chassis Number</label>
                    <input name="chassisNo" value={formData.chassisNo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="Optional" />
                  </div>
                </div>
              </section>

              {/* Section 2: Registration Details */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Registration Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Franchise Number *</label>
                    <input 
                      required name="franchiseNo" value={formData.franchiseNo} onChange={handleChange} 
                      className={`w-full px-3 py-2 border ${errors.franchiseNo ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 bg-white text-slate-900`} 
                      placeholder="e.g. 2024-00123" 
                    />
                    {errors.franchiseNo && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.franchiseNo}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">LTFRB Case Number</label>
                    <input name="ltfrbCaseNo" value={formData.ltfrbCaseNo} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Issue Date</label>
                    <input name="registrationIssueDate" type="date" value={formData.registrationIssueDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Expiry Date</label>
                    <div className="relative">
                      <input 
                        name="registrationExpiryDate" type="date" value={formData.registrationExpiryDate} onChange={handleChange} 
                        className={`w-full px-3 py-2 border ${errors.registrationExpiryDate ? 'border-red-300 focus:ring-red-500' : isExpiringSoon(formData.registrationExpiryDate) ? 'border-amber-400 focus:ring-amber-500' : 'border-slate-300 focus:ring-blue-500'} rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 bg-white text-slate-900`} 
                      />
                      {isExpiringSoon(formData.registrationExpiryDate) && !errors.registrationExpiryDate && (
                        <div className="absolute -top-6 right-0 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Expiring Soon
                        </div>
                      )}
                    </div>
                    {errors.registrationExpiryDate && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.registrationExpiryDate}</p>}
                  </div>
                </div>
              </section>

              {/* Section 3: Assignment & Status */}
              <section>
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider pb-2 border-b border-slate-200">Assignment & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Route Assignment</label>
                    <div className="relative">
                      <select name="route" value={formData.route} onChange={handleChange} className="w-full px-3 py-2 pl-9 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-slate-900">
                        {ROUTES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-${ROUTES.find(r=>r.id===formData.route)?.color || 'slate'}-500`}></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Status</label>
                    <div className="flex bg-slate-200/50 p-1 rounded-lg">
                      {STATUSES.map(status => (
                        <button
                          key={status} type="button"
                          onClick={() => handleChange({ target: { name: 'status', value: status } })}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${formData.status === status ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date Acquired</label>
                    <input name="dateAcquired" type="date" value={formData.dateAcquired} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Acquisition Cost (₱)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₱</span>
                      <input name="acquisitionCost" type="number" value={formData.acquisitionCost} onChange={handleChange} className="w-full px-3 py-2 pl-7 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-slate-900" placeholder="Any special notes or remarks about this unit..."></textarea>
                  </div>
                </div>
              </section>

              {/* Section 4: Documents */}
              <section>
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Unit Documents</h3>
                  <button type="button" onClick={() => docInputRef.current?.click()} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors">
                    <Plus className="w-3 h-3" /> Add Document
                  </button>
                  <input type="file" ref={docInputRef} onChange={handleDocUpload} multiple className="hidden" />
                </div>
                
                {documents.length === 0 ? (
                  <div 
                    onClick={() => docInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors bg-white"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-900">Upload Documents</p>
                    <p className="text-xs text-slate-500 mt-1">Drag and drop or click to browse</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-3 border border-slate-200 rounded-lg bg-white">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                            <p className="text-[10px] text-slate-500">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <select 
                            value={doc.type} 
                            onChange={(e) => updateDoc(doc.id, 'type', e.target.value)}
                            className="border border-slate-300 rounded-md p-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                          >
                            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                          </select>
                          <input 
                            type="date"
                            value={doc.expiryDate}
                            onChange={(e) => updateDoc(doc.id, 'expiryDate', e.target.value)}
                            className="border border-slate-300 rounded-md p-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 w-32 bg-white text-slate-900"
                          />
                          <button type="button" onClick={() => removeDoc(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
          <div className="flex gap-3">
            <button 
              type="button" 
              className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Save as Draft
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 min-w-[120px] justify-center"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Unit
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

