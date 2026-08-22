import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Camera,
  Loader2,
  ChevronRight
} from 'lucide-react';
import type { CustomerDevice, WarrantyClaimRecord } from '../../types';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { supabase } from '../../supabase';

interface WarrantyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: CustomerDevice[];
  customerPhone: string;
  onClaimSubmitted: (claim: WarrantyClaimRecord) => void;
}

export const WarrantyClaimModal: React.FC<WarrantyClaimModalProps> = ({
  isOpen,
  onClose,
  devices,
  customerPhone,
  onClaimSubmitted
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id || '');
  const [issueCategory, setIssueCategory] = useState('Display & Screen');
  const [issueDescription, setIssueDescription] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<WarrantyClaimRecord | null>(null);

  if (!isOpen) return null;

  const activeDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];
  const isWarrantyActive = activeDevice && activeDevice.status !== 'expired';

  const categories = [
    'Display & Screen',
    'Battery & Power',
    'Charging & USB Port',
    'Logic Board / Motherboard',
    'Audio & Microphone',
    'Camera & Optical Sensors',
    'Network & Connectivity',
    'Other Hardware Defect'
  ];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDevice) return;

    setSubmitting(true);
    const claimNo = `WC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClaim: WarrantyClaimRecord = {
      id: claimNo,
      deviceId: activeDevice.id,
      deviceName: activeDevice.name,
      serialOrImei: activeDevice.serialOrImei,
      invoiceId: activeDevice.invoiceId,
      issueCategory,
      issueDescription,
      contactPhone: customerPhone,
      status: 'Submitted',
      statusNote: 'Initial claim registered online. Technical team reviewing warranty eligibility.',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from('warranty_claims').insert([
        {
          id: claimNo,
          invoice_id: activeDevice.invoiceId,
          device_name: activeDevice.name,
          serial_or_imei: activeDevice.serialOrImei,
          contact_phone: customerPhone,
          issue_category: issueCategory,
          issue_description: issueDescription,
          status: 'Submitted',
          status_note: 'Initial claim registered online. Technical team reviewing warranty eligibility.'
        }
      ]);
    } catch (err) {
      console.warn('Could not sync claim to cloud table, fallback to memory state:', err);
    }

    setSubmittedClaim(newClaim);
    onClaimSubmitted(newClaim);
    setSubmitting(false);
  };

  const handleReset = () => {
    setSubmittedClaim(null);
    setIssueDescription('');
    setPhotoUploaded(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="portal-card-container relative w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedClaim ? (
          /* Success Screen */
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-3 py-1 rounded-full">
                Claim Registered
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Warranty Claim #{submittedClaim.id}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your warranty claim for <strong className="text-slate-900 dark:text-white">{submittedClaim.deviceName}</strong> has been received. Our service engineers will review the diagnostics and notify you via WhatsApp.
              </p>
            </div>

            {/* Lifecycle Stages Preview */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-left space-y-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Claim Status Progress
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-[10px] font-bold">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-xs">1. Submitted</div>
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">2. Review</div>
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">3. Approved</div>
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">4. Intake</div>
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">5. Repair</div>
                <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">6. Ready</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm rounded-2xl hover:opacity-90 transition shadow-md shadow-cyan-600/25 cursor-pointer"
            >
              Done & View In Claims Hub
            </button>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Official Warranty Services</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Submit a Warranty Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official hardware warranty evaluation and zero-cost repair processing for verified purchases.
              </p>
            </div>

            {/* Device Selector */}
            <div className="space-y-1.5">
              {devices.length > 0 ? (
                <CustomSelect
                  label="Select Your Covered Device"
                  required
                  value={selectedDeviceId}
                  onChange={(val) => setSelectedDeviceId(val)}
                  options={devices.map((dev) => {
                    let cleanName = dev.name;
                    let sub = `Inv: ${dev.invoiceId} · Purchased ${dev.purchaseDate}`;
                    let badge = dev.serialOrImei && !dev.serialOrImei.includes('N/A') ? `S/N: ${dev.serialOrImei}` : 'Accessory';
                    let badgeTone: 'cyan' | 'amber' | 'purple' | 'slate' = 'cyan';

                    if (cleanName.toLowerCase().includes('repair settlement')) {
                      const match = cleanName.match(/\((.*?)\)/);
                      if (match && match[1]) {
                        const jobMatch = cleanName.match(/(#JOB-[A-Za-z0-9-]+)/);
                        cleanName = match[1];
                        sub = `${jobMatch ? jobMatch[1] : 'Repair Job'} · Serviced Hardware`;
                        badge = 'Serviced Hardware';
                        badgeTone = 'amber';
                      }
                    }

                    return {
                      value: dev.id,
                      label: cleanName,
                      sublabel: sub,
                      badge,
                      badgeTone,
                    };
                  })}
                />
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  No active devices found in this session.
                </div>
              )}

              {/* Warranty Coverage Snapshot */}
              {activeDevice && (
                <div className="mt-2 p-3 bg-cyan-500/10 border-2 border-cyan-500/25 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {activeDevice.name.replace(/Repair settlement for #JOB-[A-Za-z0-9-]+\s*\((.*?)\)/, '$1')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Purchased {activeDevice.purchaseDate} · Inv: {activeDevice.invoiceId}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isWarrantyActive 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    {isWarrantyActive ? `${activeDevice.daysRemaining} Days Left` : 'Expired'}
                  </span>
                </div>
              )}
            </div>

            {/* Issue Category */}
            <div className="space-y-1.5">
              <CustomSelect
                label="Issue Category"
                required
                value={issueCategory}
                onChange={(val) => setIssueCategory(val)}
                options={categories.map((cat) => ({
                  value: cat,
                  label: cat,
                }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Detailed Problem Description
              </label>
              <textarea
                rows={3}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe what happened, error messages, when it occurs, etc..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-cyan-500 transition resize-none placeholder:text-slate-400 font-medium"
                required
              />
            </div>

            {/* Photo / Proof Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>Upload Photos / Proof (Optional)</span>
                <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</span>
              </label>
              <label 
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 ${
                  photoUploaded 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                    : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500 bg-slate-50 dark:bg-slate-950'
                }`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoSelect} 
                  className="hidden" 
                />
                {photoPreview ? (
                  <div className="flex items-center space-x-3">
                    <img src={photoPreview} alt="Evidence" className="w-12 h-12 object-cover rounded-xl border border-emerald-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✓ 1 Evidence Photo Attached</p>
                      <p className="text-[10px] text-slate-500">Tap to replace photo</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload diagnostic screenshots or device photos</p>
                  </>
                )}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !isWarrantyActive}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Official Claim...</span>
                </>
              ) : (
                <>
                  <span>Submit Warranty Claim</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
