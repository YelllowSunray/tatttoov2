'use client';

import { useState, useEffect } from 'react';
import { FilterSet } from '@/types';

interface GenerateTattooModalProps {
  filterSet: FilterSet;
  onClose: () => void;
  onSuccess?: (imageUrl: string) => void;
}

export function GenerateTattooModal({ filterSet, onClose, onSuccess }: GenerateTattooModalProps) {
  const [subjectMatter, setSubjectMatter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [needsHuggingFaceKey, setNeedsHuggingFaceKey] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Cleanup Blob URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleGenerate = async () => {
    if (!subjectMatter.trim()) {
      setError('Please enter subject matter for the tattoo');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage(null);
    setGeneratedDescription(null);
    setNeedsHuggingFaceKey(false);
    setImageLoading(false);

    try {
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          styles: filterSet.styles,
          sizePreference: filterSet.sizePreference,
          subjectMatter: subjectMatter.trim(),
          colorPreference: filterSet.colorPreference,
          bodyParts: filterSet.bodyParts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tattoo');
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
        
        console.log('Image state updated, URL:', imageUrl.substring(0, 50));
        
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
            <h3 className="text-lg font-light text-black mb-3">Generated Design</h3>
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

