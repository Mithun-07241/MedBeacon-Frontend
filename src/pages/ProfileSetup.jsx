import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User, Calendar, Phone, MapPin, Upload, Stethoscope, Briefcase, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProfileSetup() {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const isDoctor = user?.role === 'doctor';
    const isVerified = user?.verificationStatus === 'verified';

    const [formData, setFormData] = useState({
        dateOfBirth: '',
        phoneNumber: '',
        age: '',
        address: '',
        allergies: '',
        profilePicUrl: '',
        proofFileUrl: '',
        specialization: '',
        experience: '',
        gender: '',
        treatmentFileUrl: '',
    });

    const [profilePic, setProfilePic] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [treatmentFile, setTreatmentFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileSelect = (file, field) => {
        setIsUploading(true);
        try {
            if (field === 'profilePicUrl') setProfilePic(file);
            if (field === 'proofFileUrl') setProofFile(file);
            if (field === 'treatmentFileUrl') setTreatmentFile(file);
            updateField(field, file.name);
            toast({ title: 'File Selected', description: `${file.name} ready to upload.` });
        } catch {
            toast({ title: 'Selection Failed', description: 'Try again.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const validateForm = () => {
        if (!formData.dateOfBirth || !formData.phoneNumber || !formData.address) {
            return 'Please fill all required fields.';
        }
        if (isDoctor && (!formData.specialization || !formData.experience || !formData.gender)) {
            return 'Please fill all doctor-specific fields.';
        }
        if (!isDoctor && !formData.gender) {
            return 'Please select your gender.';
        }
        if (isDoctor && !proofFile) {
            return 'Please upload your proof of credentials.';
        }
        return null;
    };

    const mutation = useMutation({
        mutationFn: async (data) => {
            const fd = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                // Don't append file field names, only append actual files
                if (value && key !== 'profilePicUrl' && key !== 'proofFileUrl' && key !== 'treatmentFileUrl') {
                    fd.append(key, value);
                }
            });

            if (profilePic) fd.append('profilePicUrl', profilePic);
            if (proofFile) fd.append('proofFileUrl', proofFile);
            if (treatmentFile) fd.append('treatmentFileUrl', treatmentFile);

            await apiRequest('POST', '/api/profile/complete', fd);
        },
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
            try {
                await apiRequest('PATCH', '/api/profile/update-completion', { profileCompleted: true });
            } catch (err) {
                console.error('Failed to update profileCompleted', err);
            }

            toast({
                title: 'Profile Completed',
                description: isDoctor
                    ? "Your profile is pending verification. We'll notify you once approved."
                    : 'Profile setup complete. Welcome!',
            });

            setTimeout(() => {
                if (isDoctor) window.location.href = '/doctor-dashboard';
                else window.location.href = '/patient-dashboard';
            }, 1200);
        },
        onError: (error) => {
            if (isUnauthorizedError(error)) {
                toast({ title: 'Session Expired', description: 'Please login again.', variant: 'destructive' });
                setTimeout(() => window.location.href = '/login', 1000);
                return;
            }
            toast({ title: 'Error', description: error?.message || 'Failed to complete profile.', variant: 'destructive' });
        },
    });

    const calculateAge = (dob) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleDateChange = (e) => {
        const date = e.target.value;
        const age = calculateAge(date);
        setFormData(prev => ({
            ...prev,
            dateOfBirth: date,
            age: age >= 0 ? age : ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const error = validateForm();
        if (error) {
            toast({ title: 'Validation Error', description: error, variant: 'destructive' });
            return;
        }
        mutation.mutate(formData);
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden">
            {/* Subtle Texture/Background - simplified */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

            <div className="w-full max-w-3xl relative z-10 animate-fadeIn">
                {/* Header */}
                <div className="text-center mb-10 animate-slideDown">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-6 shadow-xl ring-4 ring-gray-100 p-3">
                        <img src="/icon-logo.png" alt="MedBeacon" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Complete Your Profile</h1>
                    <p className="text-gray-600 text-lg">Just a few more details to get started</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 animate-slideUp">
                    {/* Progress Indicator */}
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-900 uppercase">Profile Completion</span>
                            <span className="text-sm font-medium text-gray-500">Step 2 of 2</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-black h-full rounded-full transition-all duration-700 ease-out" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Username (Read-only) */}
                        <div className="space-y-2 group">
                            <Label className="text-gray-900 font-medium flex items-center gap-2 group-focus-within:text-black transition-colors">
                                <User className="w-4 h-4" />
                                Username
                            </Label>
                            <Input
                                value={user.username || user.email}
                                readOnly
                                className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed h-12 rounded-xl focus:ring-0 focus:border-gray-200"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                            <Label className="text-gray-900 font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date of Birth *
                            </Label>
                            <Input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleDateChange}
                                required
                                className="h-12 rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label className="text-gray-900 font-medium flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone Number *
                            </Label>
                            <Input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => updateField('phoneNumber', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                                required
                                className="h-12 rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400"
                            />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <Label className="text-gray-900 font-medium">Gender *</Label>
                            <div className="relative">
                                <select
                                    value={formData.gender}
                                    onChange={(e) => updateField('gender', e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 appearance-none cursor-pointer font-medium"
                                    required
                                >
                                    <option value="" disabled hidden>Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Doctor-specific fields */}
                        {isDoctor && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-gray-900 font-medium flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4" />
                                        Specialization *
                                    </Label>
                                    <Input
                                        value={formData.specialization}
                                        onChange={(e) => updateField('specialization', e.target.value)}
                                        placeholder="Cardiology"
                                        required
                                        className="h-12 rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-900 font-medium flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Experience (Years) *
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.experience}
                                        onChange={(e) => updateField('experience', e.target.value)}
                                        placeholder="5"
                                        required
                                        className="h-12 rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400"
                                    />
                                </div>
                            </>
                        )}

                        {/* Patient-specific field */}
                        {!isDoctor && (
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-gray-900 font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Allergies
                                </Label>
                                <Textarea
                                    value={formData.allergies}
                                    onChange={(e) => updateField('allergies', e.target.value)}
                                    rows={2}
                                    placeholder="List any allergies..."
                                    className="rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400 resize-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Address - Full width */}
                    <div className="space-y-2 mt-8">
                        <Label className="text-gray-900 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Location / Address *
                        </Label>
                        <Textarea
                            value={formData.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            rows={3}
                            placeholder="Enter your full address..."
                            required
                            className="rounded-xl border-gray-200 bg-white focus:border-black focus:ring-1 focus:ring-black transition-all duration-300 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {/* File Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        {/* Profile Picture */}
                        <div className="space-y-2">
                            <Label className="text-gray-900 font-medium flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Profile Picture
                            </Label>
                            <label
                                htmlFor="profilePic"
                                className={`flex items-center justify-center w-full h-14 rounded-xl border border-dashed cursor-pointer transition-all duration-300 group ${profilePic ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'} `}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'profilePicUrl')}
                                    className="hidden"
                                    id="profilePic"
                                />
                                <div className="flex items-center gap-2">
                                    <Upload className={`w-4 h-4 transition-colors ${profilePic ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                                    <span className={`text-sm font-medium transition-colors ${profilePic ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                                        {profilePic ? profilePic.name : 'Upload Photo'}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Doctor Credentials */}
                        {isDoctor && (
                            <div className="space-y-2">
                                <Label className="text-gray-900 font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Proof of Credentials *
                                </Label>
                                <label
                                    htmlFor="proofFile"
                                    className={`flex items-center justify-center w-full h-14 rounded-xl border border-dashed cursor-pointer transition-all duration-300 group ${proofFile ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'} `}
                                >
                                    <input
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'proofFileUrl')}
                                        className="hidden"
                                        id="proofFile"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Upload className={`w-4 h-4 transition-colors ${proofFile ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                                        <span className={`text-sm font-medium transition-colors ${proofFile ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                                            {proofFile ? proofFile.name : 'Upload Document'}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Patient Treatment Files */}
                        {!isDoctor && (
                            <div className="space-y-2">
                                <Label className="text-gray-900 font-medium flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Previous Treatments
                                </Label>
                                <label
                                    htmlFor="treatmentFile"
                                    className={`flex items-center justify-center w-full h-14 rounded-xl border border-dashed cursor-pointer transition-all duration-300 group ${formData.treatmentFileUrl ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'} `}
                                >
                                    <input
                                        type="file"
                                        accept="image/*,.pdf,.doc,.docx"
                                        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'treatmentFileUrl')}
                                        className="hidden"
                                        id="treatmentFile"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Upload className={`w-4 h-4 transition-colors ${formData.treatmentFileUrl ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                                        <span className={`text-sm font-medium transition-colors ${formData.treatmentFileUrl ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                                            {formData.treatmentFileUrl || 'Upload Record'}
                                        </span>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (isDoctor && isVerified) window.location.href = '/doctor-dashboard';
                                else if (isDoctor && user?.verificationStatus === 'pending') window.location.href = '/verification-pending';
                                else window.location.href = '/patient-dashboard';
                            }}
                            className="flex-1 h-12 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 hover:text-black hover:border-gray-300 transition-all bg-white"
                        >
                            Complete Later
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={mutation.isPending || isUploading}
                            className="flex-1 h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-black/5 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {mutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Complete Profile</span>
                                </div>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideDown { animation: slideDown 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out 0.2s both; }
      `}</style>
        </div>
    );
}
