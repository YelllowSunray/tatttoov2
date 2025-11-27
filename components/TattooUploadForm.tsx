'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadTattoo, updateTattoo, getArtistByUserId } from '@/lib/artist';
import { uploadImage, getTattooImagePath } from '@/lib/storage';
import { Tattoo } from '@/types';

const STYLE_GROUPS = [
  {
    label: 'Realistic',
    options: [
      'Black & Grey Realism',
      'Color Realism',
      'Portraits',
    ],
  },
  {
    label: 'Traditional & Cultural',
    options: [
      'American Traditional',
      'Japanese (Irezumi)',
      'Tribal / Polynesian',
    ],
  },
  {
    label: 'Linework & Minimal',
    options: [
      'Fine Line',
      'Minimalist',
      'Single Needle',
    ],
  },
  {
    label: 'Artistic & Abstract',
    options: [
      'Watercolor',
      'Abstract / Sketch',
      'Geometric / Dotwork',
    ],
  },
  {
    label: 'Modern Illustrative',
    options: [
      'Neo-Traditional',
      'New School',
      'Cartoon / Anime',
    ],
  },
] as const;

const STYLE_VALUES: string[] = STYLE_GROUPS.flatMap((group) => group.options);

interface TattooUploadFormProps {
  tattoo?: Tattoo; // Optional tattoo for edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TattooUploadForm({ tattoo, onSuccess, onCancel }: TattooUploadFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    description: '',
    price: '',
    style: '',
    bodyPart: '',
    color: false,
    size: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Initialize form with tattoo data if editing, or reset if not
  useEffect(() => {
    if (tattoo) {
      setFormData({
        description: tattoo.description || '',
        price: tattoo.price?.toString() || '',
        style: tattoo.style || '',
        bodyPart: tattoo.bodyPart || '',
        color: tattoo.color ?? false,
        size: tattoo.size || '',
      });
      setPreview(tattoo.imageUrl);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Reset form for new upload
      setFormData({
        description: '',
        price: '',
        style: '',
        bodyPart: '',
        color: false,
        size: '',
      });
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [tattoo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please ensure you are logged in');
      return;
    }

    // When creating new tattoo, file is required; when editing, it's optional
    if (!tattoo && !selectedFile) {
      setError('Please select an image');
      return;
    }

    // Validate required fields
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price is required and must be greater than 0');
      return;
    }
    if (!formData.style.trim()) {
      setError('Style is required');
      return;
    }
    if (!formData.bodyPart.trim()) {
      setError('Body part is required');
      return;
    }
    if (!formData.size.trim()) {
      setError('Size is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get or verify artist profile
      const artist = await getArtistByUserId(user.uid);
      if (!artist) {
        setError('Please set up your artist profile first');
        setLoading(false);
        return;
      }

      let imageUrl = tattoo?.imageUrl || '';

      // Upload new image if file is selected
      if (selectedFile) {
        const tempTattooId = tattoo?.id || `temp_${Date.now()}`;
        const imagePath = getTattooImagePath(user.uid, tempTattooId, selectedFile.name);
        imageUrl = await uploadImage(selectedFile, imagePath);
      }

      if (tattoo) {
        // Update existing tattoo
        await updateTattoo(
          tattoo.id,
          {
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            size: formData.size.trim(),
            style: formData.style.trim(),
            bodyPart: formData.bodyPart.trim(),
            color: formData.color,
            ...(selectedFile ? { imageUrl } : {}), // Only update imageUrl if new file was selected
          },
          user.uid
        );
      } else {
        // Create new tattoo
        const tattooData: Omit<Tattoo, 'id' | 'createdAt' | 'updatedAt'> = {
          artistId: artist.id,
          imageUrl,
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          size: formData.size.trim(),
          style: formData.style.trim(),
          bodyPart: formData.bodyPart.trim(),
          color: formData.color,
          // Visible by default for artist uploads; admin can override
          isVisible: true,
        };

        await uploadTattoo(tattooData);

        // Reset form only for new uploads
        setFormData({
          description: '',
          price: '',
          style: '',
          bodyPart: '',
          color: false,
          size: '',
        });
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${tattoo ? 'update' : 'upload'} tattoo. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
          Tattoo Image {!tattoo && <span className="text-black">*</span>}
        </label>
        {tattoo && (
          <p className="mb-2 text-xs text-black/50">
            {selectedFile ? 'New image selected. Leave empty to keep current image.' : 'Leave empty to keep current image.'}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          required={!tattoo}
          className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2.5 file:text-xs file:font-medium file:text-white file:uppercase file:tracking-wider file:min-h-[44px] hover:file:bg-black/90 active:file:bg-black/80 focus:border-black focus:outline-none transition-colors touch-manipulation"
        />
        {preview && (
          <div className="mt-6 border border-black/10">
            <img
              src={preview}
              alt={tattoo ? "Current tattoo" : "Preview"}
              className="w-full h-auto"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
          Description <span className="text-black">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
          className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors resize-none"
          placeholder="Describe this tattoo..."
        />
      </div>

      <div>
        <label htmlFor="price" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
          Price (€) <span className="text-black">*</span>
        </label>
        <input
          id="price"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        <div>
          <label htmlFor="style" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
            Style <span className="text-black">*</span>
          </label>
          <select
            id="style"
            value={formData.style}
            onChange={(e) => setFormData({ ...formData, style: e.target.value })}
            required
            className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-black focus:border-black focus:outline-none transition-colors"
          >
            <option value="">Select a style...</option>
            {!STYLE_VALUES.includes(formData.style) && formData.style && (
              <option value={formData.style}>{formData.style}</option>
            )}
            {STYLE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bodyPart" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
            Body Part <span className="text-black">*</span>
          </label>
          <select
            id="bodyPart"
            value={formData.bodyPart}
            onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
            required
            className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-black focus:border-black focus:outline-none transition-colors"
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
      </div>

      <div>
        <label htmlFor="size" className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider">
          Size <span className="text-black">*</span>
        </label>
        <input
          id="size"
          type="text"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          required
          className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors"
          placeholder="Small, Medium, Large, or dimensions"
        />
      </div>

      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.checked })}
            className="h-4 w-4 border-black/20 text-black focus:ring-black"
          />
          <span className="text-xs font-medium text-black/60 uppercase tracking-wider">Color tattoo</span>
        </label>
      </div>

      {error && (
        <div className="border border-black/20 bg-black/5 p-4 text-sm text-black">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || (!tattoo && !selectedFile) || !formData.description.trim() || !formData.price || !formData.size.trim() || !formData.style.trim() || !formData.bodyPart.trim()}
          className="flex-1 rounded-full bg-black px-6 py-3 sm:py-4 text-xs font-medium text-white transition-all hover:bg-black/90 active:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider min-h-[44px] touch-manipulation"
        >
          {loading ? (tattoo ? 'Updating...' : 'Uploading...') : (tattoo ? 'Update Tattoo' : 'Upload Tattoo')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-black px-6 py-3 sm:py-4 text-xs font-medium text-black transition-all hover:bg-black hover:text-white active:bg-black/90 active:text-white disabled:opacity-50 uppercase tracking-wider min-h-[44px] touch-manipulation"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

