'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    campaignName: '',
    influencersFollowers: '',
    campaignType: '',
    startDate: '',
    brandName: '',
    endDate: '',
    niche: '',
    priority: 'Select',
    budget: '',
    notes: '',
    deliverables: '',
    attachment: null as File | null,
    platforms: {
      instagram: false,
      facebook: false,
      youtube: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const validateField = (name: string, value: string | File | { instagram: boolean; facebook: boolean; youtube: boolean } | null): string => {
    switch (name) {
      case 'campaignName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Campaign name is required';
        }
        if (typeof value === 'string' && value.length < 3) {
          return 'Campaign name must be at least 3 characters';
        }
        break;
      case 'influencersFollowers':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Influencer&apos;s followers is required';
        }
        if (typeof value === 'string' && !/^\d+[KkMm]?\+?$/.test(value)) {
          return 'Must be a valid number (e.g., 1000, 10K+, 5M)';
        }
        break;
      case 'campaignType':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Campaign type is required';
        }
        break;
      case 'startDate':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Start date is required';
        }
        break;
      case 'brandName':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Brand name is required';
        }
        break;
      case 'endDate':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'End date is required';
        }
        if (typeof value === 'string' && formData.startDate && value < formData.startDate) {
          return 'End date must be after start date';
        }
        break;
      case 'niche':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Niche is required';
        }
        break;
      case 'priority':
        if (!value || value === 'Select') {
          return 'Please select a priority';
        }
        break;
      case 'budget':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Budget is required';
        }
        if (typeof value === 'string' && !/^\d+(\.\d{1,2})?[KkMm]?\+?$/.test(value)) {
          return 'Must be a valid amount (e.g., 5000, 10K+, 2.5M)';
        }
        break;
      case 'deliverables':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return 'Deliverables is required';
        }
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, attachment: file }));
  };

  const handlePlatformChange = (platform: 'instagram' | 'facebook' | 'youtube') => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform]
      }
    }));
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name as keyof typeof formData];
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'notes' && key !== 'attachment' && key !== 'platforms') {
        newTouched[key] = true;
        const error = validateField(key, formData[key as keyof typeof formData]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Prevent duplicate submissions
      if (isRequestInProgress) {
        console.log('Request already in progress, ignoring duplicate submission');
        return;
      }
      
      setIsSubmitting(true);
      setIsRequestInProgress(true);
      setSubmitError(null);
      
      try {
        // Prepare form data for webhook
        const selectedPlatforms = Object.entries(formData.platforms)
          .filter(([_, isSelected]) => isSelected)
          .map(([platform, _]) => platform.charAt(0).toUpperCase() + platform.slice(1));
        
        // Use FormData for file uploads but structure it properly
        const formDataToSend = new FormData();
        
        // Add all text fields
        formDataToSend.append('campaignName', formData.campaignName);
        formDataToSend.append('influencersFollowers', formData.influencersFollowers);
        formDataToSend.append('campaignType', formData.campaignType);
        formDataToSend.append('startDate', formData.startDate);
        formDataToSend.append('brandName', formData.brandName);
        formDataToSend.append('endDate', formData.endDate);
        formDataToSend.append('niche', formData.niche);
        formDataToSend.append('priority', formData.priority);
        formDataToSend.append('budget', formData.budget);
        formDataToSend.append('notes', formData.notes || '');
        formDataToSend.append('deliverables', formData.deliverables);
        formDataToSend.append('platforms', selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'None');
        formDataToSend.append('timestamp', new Date().toISOString());
        
        // Add file if present
        if (formData.attachment) {
          formDataToSend.append('attachment', formData.attachment);
        }

        // Debug: Log all FormData entries
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('FormData entries being sent:');
        for (const [key, value] of formDataToSend.entries()) {
          console.log(`- ${key}:`, value);
        }
        console.log('Selected platforms:', selectedPlatforms);
        console.log('File attachment:', formData.attachment ? {
          name: formData.attachment.name,
          size: formData.attachment.size,
          type: formData.attachment.type
        } : 'No file');
        console.log('=== END DEBUG ===');

        // Send data to webhook using FormData (single request)
        console.log('=== SENDING SINGLE WEBHOOK REQUEST ===');
        const response = await fetch('https://n8n.srv1042815.hstgr.cloud/webhook/d9e67f53-dbf7-4886-946d-ba1c51553e99', {
          method: 'POST',
          body: formDataToSend,
          mode: 'cors'
        });
        console.log('=== WEBHOOK REQUEST COMPLETED ===');

        console.log('Webhook response status:', response.status);
        console.log('Webhook response headers:', Object.fromEntries(response.headers.entries()));
        
        // Log response body for debugging
        const responseText = await response.text();
        console.log('Webhook response body:', responseText);

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          console.log('Webhook response data:', responseData);
          setShowSuccessPopup(true);
          // Reset form after successful submission
          setFormData({
            campaignName: '',
            influencersFollowers: '',
            campaignType: '',
            startDate: '',
            brandName: '',
            endDate: '',
            niche: '',
            priority: 'Select',
            budget: '',
            notes: '',
            deliverables: '',
            attachment: null,
            platforms: {
              instagram: false,
              facebook: false,
              youtube: false
            }
          });
          setTouched({});
          setErrors({});
        } else {
          console.error('Webhook failed with status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          let errorText = '';
          let errorMessage = `HTTP error! status: ${response.status}`;
          
          try {
            errorText = await response.text();
            console.error('Raw error response:', errorText);
            
            if (errorText && errorText.trim() !== '') {
              try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                  errorMessage += ` - ${errorJson.message}`;
                } else if (errorJson.error) {
                  errorMessage += ` - ${errorJson.error}`;
                } else {
                  errorMessage += ` - ${errorText}`;
                }
              } catch {
                errorMessage += ` - ${errorText}`;
              }
            } else {
              errorMessage += ' - No response body received';
            }
          } catch (textError) {
            console.error('Error reading response text:', textError);
            errorMessage += ' - Could not read response body';
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        // Provide more detailed error information
        if (error instanceof Error) {
          setSubmitError(`Failed to submit: ${error.message}`);
        } else {
          setSubmitError('Failed to submit campaign details. Please check your connection and try again.');
        }
      } finally {
        setIsSubmitting(false);
        setIsRequestInProgress(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-[440px] bg-gray-50 pt-12 pb-12 pl-12 pr-0 flex-col justify-between">
        {/* Top Section - Back link and Logo */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">Untitled UI</span>
          </div>
        </div>

        {/* Center Section - Avatars with circles cut on left from center */}
        <div className="relative flex-1 flex items-center justify-center min-h-[400px] overflow-hidden">
          <svg width="700" height="700" viewBox="0 0 700 700" className="absolute" style={{right: '-350px'}}>
            {/* Full circles centered on right edge, zoomed to touch right border */}
            <circle cx="350" cy="350" r="100" stroke="#E5E7EB" strokeWidth="1" fill="none"/>
            <circle cx="350" cy="350" r="180" stroke="#E5E7EB" strokeWidth="1" fill="none"/>
            <circle cx="350" cy="350" r="260" stroke="#E5E7EB" strokeWidth="1" fill="none"/>
            <circle cx="350" cy="350" r="340" stroke="#E5E7EB" strokeWidth="1" fill="none"/>
          </svg>

          {/* Avatar 1 - Top area on outer circle */}
          <div className="absolute" style={{top: '12%', right: '10px'}}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 2 - Upper left on circle */}
          <div className="absolute" style={{top: '22%', left: '80px'}}>
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 3 - Right side upper-middle */}
          <div className="absolute" style={{top: '35%', right: '40px'}}>
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 4 - Center area on inner circle */}
          <div className="absolute" style={{top: '48%', left: '45%', transform: 'translate(-50%, -50%)'}}>
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 5 - Lower left on circle */}
          <div className="absolute" style={{bottom: '25%', left: '60px'}}>
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 6 - Right side lower area */}
          <div className="absolute" style={{bottom: '28%', right: '70px'}}>
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
          {/* Avatar 7 - Bottom area on outer circle */}
          <div className="absolute" style={{bottom: '10%', right: '120px'}}>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
              alt="Team member"
              className="w-14 h-14 rounded-full border-4 border-white object-cover shadow-md"
            />
          </div>
        </div>

        {/* Bottom Section - Social media links */}
        <div className="space-y-3">
          <a href="#" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"/>
            </svg>
            <span className="text-sm font-medium">@UntitledUI</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
            </svg>
            <span className="text-sm font-medium">@UntitledUI</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 01.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
            </svg>
            <span className="text-sm font-medium">@UntitledUI</span>
          </a>
          <a href="#" className="flex items-center gap-3 text-purple-600 hover:text-purple-700">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z"/>
            </svg>
            <span className="text-sm font-medium">@UntitledUI</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white p-6 md:p-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <h1 className="text-5xl font-semibold mb-4 text-black">Campaign Details</h1>
          <p className="text-gray-600 text-lg mb-12">Fill out the campaign information below.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name and Influencer's Followers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Campaign Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="campaignName"
                  value={formData.campaignName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('campaignName')}
                  placeholder="Campaign Name"
                  className={`w-full px-4 py-3 border ${errors.campaignName && touched.campaignName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.campaignName && touched.campaignName && (
                  <p className="mt-1 text-sm text-red-500">{errors.campaignName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Influencer&apos;s Followers <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="influencersFollowers"
                  value={formData.influencersFollowers}
                  onChange={handleChange}
                  onBlur={() => handleBlur('influencersFollowers')}
                  placeholder="Influencer's Followers"
                  className={`w-full px-4 py-3 border ${errors.influencersFollowers && touched.influencersFollowers ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.influencersFollowers && touched.influencersFollowers && (
                  <p className="mt-1 text-sm text-red-500">{errors.influencersFollowers}</p>
                )}
              </div>
            </div>

            {/* Campaign Type and Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Campaign Type <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="campaignType"
                  value={formData.campaignType}
                  onChange={handleChange}
                  onBlur={() => handleBlur('campaignType')}
                  placeholder="Campaign Type"
                  className={`w-full px-4 py-3 border ${errors.campaignType && touched.campaignType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.campaignType && touched.campaignType && (
                  <p className="mt-1 text-sm text-red-500">{errors.campaignType}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur('startDate')}
                  placeholder="dd/mm/yyyy"
                  className={`w-full px-4 py-3 border ${errors.startDate && touched.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.startDate && touched.startDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
                )}
              </div>
            </div>

            {/* Brand Name and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Brand Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="brandName"
                  value={formData.brandName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('brandName')}
                  placeholder="Brand Name"
                  className={`w-full px-4 py-3 border ${errors.brandName && touched.brandName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.brandName && touched.brandName && (
                  <p className="mt-1 text-sm text-red-500">{errors.brandName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">End Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  onBlur={() => handleBlur('endDate')}
                  placeholder="dd/mm/yyyy"
                  className={`w-full px-4 py-3 border ${errors.endDate && touched.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.endDate && touched.endDate && (
                  <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Niche and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Niche <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="niche"
                  value={formData.niche}
                  onChange={handleChange}
                  onBlur={() => handleBlur('niche')}
                  placeholder="Niche"
                  className={`w-full px-4 py-3 border ${errors.niche && touched.niche ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.niche && touched.niche && (
                  <p className="mt-1 text-sm text-red-500">{errors.niche}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Priority <span className="text-red-500">*</span></label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  onBlur={() => handleBlur('priority')}
                  className={`w-full px-4 py-3 border ${errors.priority && touched.priority ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white text-black`}
                >
                  <option>Select</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
                {errors.priority && touched.priority && (
                  <p className="mt-1 text-sm text-red-500">{errors.priority}</p>
                )}
              </div>
            </div>

            {/* Budget and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Budget <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  onBlur={() => handleBlur('budget')}
                  placeholder="Budget"
                  className={`w-full px-4 py-3 border ${errors.budget && touched.budget ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.budget && touched.budget && (
                  <p className="mt-1 text-sm text-red-500">{errors.budget}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notes"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Deliverables and Upload Attachment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Deliverables <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="deliverables"
                  value={formData.deliverables}
                  onChange={handleChange}
                  onBlur={() => handleBlur('deliverables')}
                  placeholder="Deliverables"
                  className={`w-full px-4 py-3 border ${errors.deliverables && touched.deliverables ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black placeholder:text-gray-400`}
                />
                {errors.deliverables && touched.deliverables && (
                  <p className="mt-1 text-sm text-red-500">{errors.deliverables}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Upload Attachment</label>
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Platforms</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.platforms.instagram}
                    onChange={() => handlePlatformChange('instagram')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-900">Instagram</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.platforms.facebook}
                    onChange={() => handlePlatformChange('facebook')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-900">Facebook</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.platforms.youtube}
                    onChange={() => handlePlatformChange('youtube')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-900">Youtube</span>
                </label>
              </div>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT CAMPAIGN'}
            </button>
          </form>

        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h3>
            <p className="text-gray-600">Fetching data and saving to database</p>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Fetched Successfully!</h3>
            <p className="text-gray-600 mb-6">Campaign details have been saved to the database successfully.</p>
            <button
              onClick={() => {
                setShowSuccessPopup(false);
                router.push('/dashboard');
              }}
              className="bg-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
