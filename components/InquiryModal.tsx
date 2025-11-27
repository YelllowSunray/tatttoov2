'use client';

import { useState } from 'react';
import { Artist } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface InquiryModalProps {
  artist: Artist;
  onClose: () => void;
}

export function InquiryModal({ artist, onClose }: InquiryModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customerName: user?.displayName || '',
    customerEmail: user?.email || '',
    preferredDate: '',
    preferredTime: '',
    bodyPart: '',
    budget: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistId: artist.id,
          artistEmail: artist.email,
          artistName: artist.name,
          userId: user?.uid,
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send inquiry');
      }

      setSuccess(true);
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-8">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl sm:text-3xl font-light tracking-[-0.02em] text-black">
              Inquiry Sent
            </h2>
            <p className="text-sm text-black/60 leading-relaxed mb-8">
              Your consultation request has been sent to {artist.name}. They will contact you soon.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="mb-6 ml-auto block text-black/40 hover:text-black active:text-black/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-8 sm:mb-10 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Request Consultation
        </h2>
        <p className="mb-8 text-sm text-black/50">
          Send a consultation request to <span className="font-medium text-black">{artist.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="customerName" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Your Name
            </label>
            <input
              id="customerName"
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              required
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Email <span className="text-black">*</span>
            </label>
            <input
              id="customerEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              required
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
              placeholder="your@email.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <label htmlFor="preferredDate" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Preferred Date
              </label>
              <input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="preferredTime" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
                Preferred Time
              </label>
              <input
                id="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bodyPart" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Body Part
            </label>
            <select
              id="bodyPart"
              value={formData.bodyPart}
              onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black focus:border-black focus:outline-none transition-colors duration-200"
            >
              <option value="">Select...</option>
              <option value="Arm">Arm</option>
              <option value="Leg">Leg</option>
              <option value="Back">Back</option>
              <option value="Chest">Chest</option>
              <option value="Hand">Hand</option>
              <option value="Foot">Foot</option>
              <option value="Neck">Neck</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="budget" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Budget (€)
            </label>
            <input
              id="budget"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-3 block text-xs font-medium text-black/50 uppercase tracking-[0.1em]">
              Message
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200 resize-none"
              placeholder="Tell the artist about your tattoo idea..."
            />
          </div>

          {error && (
            <div className="border border-black/20 bg-black/5 p-4 text-sm text-black">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-black px-6 py-3.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 disabled:opacity-50 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

