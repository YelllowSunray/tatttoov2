'use client';

import { useState, useEffect } from 'react';
import { FilterSet } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { saveGeneratedTattoo } from '@/lib/firestore';
import { blobUrlToFile, getGeneratedTattooImagePath, uploadImage } from '@/lib/storage';

interface GenerateTattooModalProps {
  filterSet: FilterSet;
  onClose: () => void;
  onSuccess?: (imageUrl: string) => void;
}

export function GenerateTattooModal({ filterSet, onClose, onSuccess }: GenerateTattooModalProps) {
  const { user } = useAuth();
  const [subjectMatter, setSubjectMatter] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [needsHuggingFaceKey, setNeedsHuggingFaceKey] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Cleanup Blob URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      if (referenceImagePreview) {
        URL.revokeObjectURL(referenceImagePreview);
      }
    };
  }, [blobUrl, referenceImagePreview]);

  // Handle reference image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setReferenceImage(file);
      setError('');
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setReferenceImagePreview(previewUrl);
    }
  };

  // Remove reference image
  const handleRemoveImage = () => {
    if (referenceImagePreview) {
      URL.revokeObjectURL(referenceImagePreview);
    }
    setReferenceImage(null);
    setReferenceImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('referenceImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Convert image file to base64
  const imageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Function to save generated tattoo to Firestore
  const saveGeneratedTattooToCollection = async (imageUrl: string, prompt: string) => {
    if (!user?.uid) {
      console.log('User not authenticated, skipping save');
      return;
    }

    setSaving(true);
    try {
      // Convert blob URL to File
      const file = await blobUrlToFile(imageUrl, `generated-tattoo-${Date.now()}.png`);
      
      // Create a temporary ID for the tattoo
      const tempTattooId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload image to Firebase Storage
      const imagePath = getGeneratedTattooImagePath(user.uid, tempTattooId);
      const uploadedImageUrl = await uploadImage(file, imagePath);
      
      // Save tattoo data to Firestore
      const tattooId = await saveGeneratedTattoo(user.uid, {
        imageUrl: uploadedImageUrl,
        prompt: prompt,
        subjectMatter: subjectMatter.trim(),
        filterSetId: filterSet.id,
        filterSetName: filterSet.name,
        styles: filterSet.styles,
        sizePreference: filterSet.sizePreference || undefined,
        colorPreference: filterSet.colorPreference || undefined,
        bodyParts: filterSet.bodyParts,
      });
      
      console.log('✅ Generated tattoo saved successfully:', tattooId);
      setSaved(true);
    } catch (err: any) {
      console.error('Failed to save generated tattoo:', err);
      // Don't show error to user - saving is automatic and shouldn't interrupt their flow
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!subjectMatter.trim()) {
      setError('Please enter subject matter for the tattoo');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage(null);
    setGeneratedDescription(null);
    setGeneratedModel(null);
    setNeedsHuggingFaceKey(false);
    setImageLoading(false);

    try {
      // Convert reference image to base64 if provided
      let referenceImageBase64: string | undefined;
      let referenceImageMimeType: string | undefined;
      
      if (referenceImage) {
        console.log('Converting reference image to base64...', {
          fileName: referenceImage.name,
          fileSize: referenceImage.size,
          fileType: referenceImage.type,
        });
        referenceImageBase64 = await imageToBase64(referenceImage);
        referenceImageMimeType = referenceImage.type;
        console.log('Reference image converted:', {
          base64Length: referenceImageBase64.length,
          mimeType: referenceImageMimeType,
          estimatedSizeKB: Math.round(referenceImageBase64.length * 3 / 4 / 1024),
        });
      } else {
        console.log('No reference image provided - using text-to-image generation');
      }

      const requestBody = {
        styles: filterSet.styles,
        sizePreference: filterSet.sizePreference,
        subjectMatter: subjectMatter.trim(),
        colorPreference: filterSet.colorPreference,
        bodyParts: filterSet.bodyParts,
        referenceImage: referenceImageBase64,
        referenceImageMimeType: referenceImageMimeType,
      };

      console.log('📤 Sending generation request:', {
        hasReferenceImage: !!referenceImageBase64,
        referenceImageSize: referenceImageBase64 ? `${Math.round(referenceImageBase64.length * 3 / 4 / 1024)}KB` : 'none',
        subjectMatter: subjectMatter.trim(),
        styles: filterSet.styles,
      });

      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tattoo');
      }

      // Store the prompt and model if provided
      if (data.prompt) {
        setGeneratedPrompt(data.prompt);
      }
      if (data.model) {
        setGeneratedModel(data.model);
      }

      // Check if we got an image
      if (data.image) {
        // Clean the base64 string (remove any whitespace/newlines)
        let cleanBase64 = String(data.image).replace(/\s/g, '').trim();
        
        // Remove data URL prefix if it's already included
        if (cleanBase64.startsWith('data:')) {
          const base64Index = cleanBase64.indexOf('base64,');
          if (base64Index !== -1) {
            cleanBase64 = cleanBase64.substring(base64Index + 7);
          }
        }
        
        if (!cleanBase64 || cleanBase64.length === 0) {
          throw new Error('Received empty image data');
        }
        
        // Validate base64 format (basic check)
        if (!/^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
          console.warn('Base64 string contains invalid characters');
        }
        
        const mimeType = data.mimeType || 'image/png';
        
        console.log('✅ Image received:', {
          base64Length: cleanBase64.length,
          mimeType: mimeType,
          estimatedSizeMB: (cleanBase64.length * 3 / 4 / 1024 / 1024).toFixed(2)
        });
        
        // For large images (>2MB base64), use Blob URL instead of data URL
        // Data URLs have size limits and can cause browser issues
        const base64SizeMB = cleanBase64.length * 3 / 4 / 1024 / 1024;
        
        let imageUrl: string;
        
        // Always use Blob URL for better performance and to avoid data URL size limits
        console.log(`Converting to Blob URL (${base64SizeMB.toFixed(2)}MB)`);
        try {
          // Convert base64 to binary using atob
          const binaryString = atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Create blob and URL
          const blob = new Blob([bytes], { type: mimeType });
          
          if (blob.size === 0) {
            throw new Error('Blob creation resulted in empty blob');
          }
          
          const newBlobUrl = URL.createObjectURL(blob);
          setBlobUrl(newBlobUrl); // Store for cleanup
          imageUrl = newBlobUrl;
          
          console.log('✅ Created Blob URL:', {
            blobSize: blob.size,
            blobSizeMB: (blob.size / 1024 / 1024).toFixed(2),
            blobType: blob.type,
            blobUrlPreview: newBlobUrl.substring(0, 50)
          });
        } catch (blobError: any) {
          console.error('❌ Failed to create Blob URL:', blobError);
          console.error('Error message:', blobError.message);
          
          // Fallback: Use data URL (may not work for very large images)
          console.warn('⚠️ Falling back to data URL (may have size limitations)');
          imageUrl = `data:${mimeType};base64,${cleanBase64}`;
        }
        
        // Set image immediately
        console.log('Setting image URL:', {
          type: imageUrl.startsWith('blob:') ? 'Blob URL' : imageUrl.startsWith('data:') ? 'Data URL' : 'Unknown',
          length: imageUrl.length,
          preview: imageUrl.substring(0, 100)
        });
        
        setImageLoading(true);
        setGeneratedImage(imageUrl);
        setSaved(false);
        
        console.log('Image state updated, URL:', imageUrl.substring(0, 50));
        
        // Automatically save the generated tattoo
        if (user?.uid && imageUrl) {
          // Use the prompt from the API response, which should always be included
          const promptToSave = data.prompt || '';
          if (promptToSave) {
            saveGeneratedTattooToCollection(imageUrl, promptToSave);
          } else {
            console.warn('No prompt available for saving generated tattoo');
          }
        }
        
        if (onSuccess) {
          onSuccess(imageUrl);
        }
      } else if (data.prompt) {
        // If we got a prompt instead of an image
        setNeedsHuggingFaceKey(data.needsHuggingFaceKey || false);
        setNeedsSetup(data.needsSetup || false);
        // Don't show errors as red error if setup is needed - show setup instructions instead
        if (data.needsSetup && data.setupInstructions) {
          // Setup needed - show instructions, not errors
          setError('');
          setGeneratedDescription(data.setupInstructions);
        } else if (data.errors && data.errors.length > 0) {
          // Real errors - show them
          setError(data.errors.join('. '));
          setGeneratedDescription(data.prompt + (data.note ? `\n\nNote: ${data.note}` : ''));
        } else {
          setGeneratedDescription(data.prompt + (data.note ? `\n\nNote: ${data.note}` : ''));
        }
      } else if (data.description) {
        // Fallback: If we got a description instead of an image
        setGeneratedDescription(data.description);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate tattoo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-black/20 bg-white p-6 sm:p-8 md:p-10 my-auto max-h-[90vh] overflow-y-auto"
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

        <h2 className="mb-6 text-2xl sm:text-3xl font-light tracking-[-0.02em] text-black">
          Generate Tattoo Design
        </h2>

        <div className="mb-6 p-4 bg-black/5 border border-black/10">
          <p className="text-sm text-black/60 mb-2">
            <span className="font-medium text-black/80">Filter Set:</span> {filterSet.name}
          </p>
          {filterSet.styles.length > 0 && (
            <p className="text-sm text-black/60 mb-2">
              <span className="font-medium text-black/80">Styles:</span> {filterSet.styles.join(', ')}
            </p>
          )}
          {filterSet.sizePreference && filterSet.sizePreference !== 'all' && (
            <p className="text-sm text-black/60 mb-2">
              <span className="font-medium text-black/80">Size:</span> {filterSet.sizePreference.charAt(0).toUpperCase() + filterSet.sizePreference.slice(1)}
            </p>
          )}
          {filterSet.colorPreference && (
            <p className="text-sm text-black/60">
              <span className="font-medium text-black/80">Color:</span>{' '}
              {filterSet.colorPreference === 'both' ? 'Both' : filterSet.colorPreference === 'color' ? 'Color' : 'Black & White'}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="subjectMatter" className="block text-sm font-medium text-black/80 mb-2">
            Subject Matter *
          </label>
          <textarea
            id="subjectMatter"
            value={subjectMatter}
            onChange={(e) => setSubjectMatter(e.target.value)}
            placeholder="e.g., a woman dancing in the line, a rose with thorns, a geometric wolf..."
            className="w-full px-4 py-3 border border-black/20 focus:border-black focus:outline-none text-black placeholder:text-black/40 min-h-[100px] resize-y"
            disabled={loading}
          />
          <p className="mt-2 text-xs text-black/50">
            Describe what you want in your tattoo design
          </p>
        </div>

        {/* Reference Image Upload - Temporarily Removed */}
        {/* 
        <div className="mb-6">
          <label htmlFor="referenceImage" className="block text-sm font-medium text-black/80 mb-2">
            Reference Image (Optional)
          </label>
          {!referenceImagePreview ? (
            <div className="border-2 border-dashed border-black/20 rounded-lg p-6 text-center hover:border-black/40 transition-colors">
              <input
                type="file"
                id="referenceImage"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="hidden"
              />
              <label
                htmlFor="referenceImage"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-black/40 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-black/60 mb-1">
                  Click to upload a reference image
                </p>
                <p className="text-xs text-black/40">
                  PNG, JPG, or WEBP up to 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="relative border border-black/20 rounded-lg p-4 bg-black/5">
              <img
                src={referenceImagePreview}
                alt="Reference preview"
                className="w-full h-auto max-h-[300px] object-contain rounded"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={loading}
                className="absolute top-2 right-2 bg-black/80 text-white rounded-full p-2 hover:bg-black transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                aria-label="Remove image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <p className="mt-2 text-xs text-black/50 text-center">
                {referenceImage?.name}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-black/50">
            Upload an image to use as a reference for the tattoo generation
          </p>
        </div>
        */}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && generatedImage && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs">
            <strong>Debug:</strong> Image URL set ({generatedImage.startsWith('blob:') ? 'Blob' : 'Data'} URL, length: {generatedImage.length})
          </div>
        )}

        {generatedImage && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-light text-black">Generated Design</h3>
                {generatedModel && (
                  <p className="text-xs text-black/50 mt-1">
                    Model: <span className="font-medium">{generatedModel}</span>
                  </p>
                )}
              </div>
              {saving && (
                <span className="text-xs text-black/50">Saving...</span>
              )}
              {saved && !saving && (
                <span className="text-xs text-green-600">✓ Saved</span>
              )}
            </div>
            <div 
              className="border border-black/20 p-4 bg-black/5 min-h-[200px] flex items-center justify-center relative"
              style={{ minHeight: '200px', backgroundColor: 'rgba(0,0,0,0.05)' }}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
                  <div className="text-black/60 text-sm">Loading image...</div>
                </div>
              )}
              <img
                key={generatedImage} // Use the URL as key to force re-render
                src={generatedImage}
                alt="Generated tattoo design"
                className={`w-full h-auto max-h-[500px] object-contain ${imageLoading ? 'opacity-0 absolute' : 'opacity-100 relative'}`}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log('✅ Image loaded successfully!');
                  console.log('Image dimensions:', {
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    width: img.width,
                    height: img.height,
                    srcLength: img.src.length,
                    srcPreview: img.src.substring(0, 50)
                  });
                  setImageLoading(false);
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.error('❌ Image failed to load');
                  console.error('Image src type:', generatedImage?.startsWith('blob:') ? 'Blob URL' : generatedImage?.startsWith('data:') ? 'Data URL' : 'Unknown');
                  console.error('Image URL length:', generatedImage?.length);
                  console.error('Image URL preview:', generatedImage?.substring(0, 100));
                  console.error('Image element src:', target.src?.substring(0, 100));
                  console.error('Image complete:', target.complete);
                  console.error('Image naturalWidth:', target.naturalWidth);
                  console.error('Image naturalHeight:', target.naturalHeight);
                  
                  setError('Failed to display image. Check browser console for details.');
                  setImageLoading(false);
                }}
                style={{ 
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '0 auto'
                }}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href={generatedImage}
                download="tattoo-design.png"
                className="flex-1 rounded-full border border-black px-5 py-2.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation text-center"
              >
                Download
              </a>
            </div>
            
            {/* Show the prompt that was used */}
            {generatedPrompt && (
              <div className="mt-4 border-t border-black/10 pt-4">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-between text-sm text-black/60 hover:text-black transition-colors"
                >
                  <span className="font-medium">View Prompt Used</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPrompt && (
                  <div className="mt-3 p-3 bg-black/5 border border-black/10 rounded text-xs text-black/70 font-mono whitespace-pre-wrap break-words">
                    {generatedPrompt}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {generatedDescription && !generatedImage && (
          <div className="mb-6">
            {needsSetup && generatedDescription.includes('No image generation service configured') ? (
              <>
                <h3 className="text-lg font-light text-black mb-3">Setup Required</h3>
                <div className="border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 mb-4">
                  <p className="font-medium mb-3">🚀 Quick Setup (2 minutes):</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Go to <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="underline font-medium">https://replicate.com/account/api-tokens</a></li>
                    <li>Sign up/login and create an API token</li>
                    <li>Copy the token (starts with <code className="bg-blue-100 px-1 rounded">r8_</code>)</li>
                    <li>Add this line to your <code className="bg-blue-100 px-1 rounded">.env.local</code> file:
                      <div className="mt-2 p-2 bg-blue-100 rounded font-mono text-xs">
                        REPLICATE_API_TOKEN=r8_your_token_here
                      </div>
                    </li>
                    <li>Restart your development server</li>
                    <li>Try generating again!</li>
                  </ol>
                  <p className="mt-4 text-xs text-blue-700">
                    💡 <strong>Why Replicate?</strong> Easiest setup, pay-as-you-go ($0.002-0.01 per image), high quality results.
                    See <code className="bg-blue-100 px-1 rounded">REPLICATE_SETUP.md</code> for detailed instructions.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-light text-black mb-3">Enhanced Prompt</h3>
                <div className="border border-black/20 p-4 bg-black/5 text-sm text-black/70 whitespace-pre-wrap mb-4">
                  {generatedDescription}
                </div>
                {generatedDescription.includes('Image generation services are currently unavailable') && (
                  <div className="border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <p className="font-medium mb-2">To enable image generation:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Get a free Hugging Face API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">https://huggingface.co/settings/tokens</a></li>
                      <li>Add it to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file as <code className="bg-yellow-100 px-1 rounded">HUGGINGFACE_API_KEY=your_key_here</code></li>
                      <li>Restart your development server</li>
                    </ol>
                    <p className="mt-3 text-xs">The enhanced prompt above can also be used with other image generation tools like DALL-E, Midjourney, or Stable Diffusion.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !subjectMatter.trim()}
            className="flex-1 rounded-full bg-black px-6 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Tattoo'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-black px-6 py-3.5 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

