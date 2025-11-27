import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      styles,
      sizePreference,
      subjectMatter,
      colorPreference,
      bodyParts,
    } = body;

    // Validate required fields
    if (!subjectMatter || !styles || styles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectMatter and styles are required' },
        { status: 400 }
      );
    }

    // Build the prompt for tattoo generation
    const styleText = styles.join(', ');
    const sizeText = sizePreference && sizePreference !== 'all' 
      ? `, ${sizePreference} size` 
      : '';
    const colorText = colorPreference === 'color' 
      ? ', in color' 
      : colorPreference === 'bw' 
      ? ', in black and white' 
      : '';
    const bodyPartText = bodyParts && bodyParts.length > 0
      ? `, suitable for ${bodyParts.join(' or ')} placement`
      : '';

    // Build optimized prompt for image generation
    const promptParts: string[] = [];
    
    // Add subject matter
    if (subjectMatter.trim()) {
      promptParts.push(subjectMatter.trim());
    }
    
    // Add style description
    const styleDescription = styleText.toLowerCase().includes('fine line') || styleText.toLowerCase().includes('fineline')
      ? 'fine line tattoo style, delicate thin lines, minimal shading'
      : styleText.toLowerCase().includes('traditional')
      ? 'traditional tattoo style, bold black outlines, solid colors'
      : styleText.toLowerCase().includes('realism')
      ? 'realistic tattoo style, detailed shading, photorealistic'
      : styleText.toLowerCase().includes('geometric')
      ? 'geometric tattoo style, clean lines, geometric patterns'
      : `${styleText} tattoo style`;
    promptParts.push(styleDescription);
    
    // Add color preference
    if (colorPreference === 'color') {
      promptParts.push('colorful tattoo, vibrant colors');
    } else if (colorPreference === 'bw') {
      promptParts.push('black and white tattoo, monochrome');
    } else {
      promptParts.push('black and white tattoo design');
    }
    
    // Add size context
    if (sizePreference && sizePreference !== 'all') {
      if (sizePreference === 'small') {
        promptParts.push('small tattoo design, compact composition');
      } else if (sizePreference === 'medium') {
        promptParts.push('medium tattoo design, balanced composition');
      } else if (sizePreference === 'large') {
        promptParts.push('large tattoo design, expansive composition');
      }
    }
    
    // Add body part context
    if (bodyParts && bodyParts.length > 0) {
      const bodyPart = bodyParts[0].toLowerCase();
      promptParts.push(`suitable for ${bodyPart} placement`);
    }
    
    // Add quality descriptors
    promptParts.push('clean line art', 'professional tattoo design', 'high quality', 'detailed', 'tattoo stencil style', 'suitable for tattooing');
    
    const enhancedPrompt = promptParts.join(', ');

    // Try multiple image generation services
    const imageServices = [
      // Service 1: Replicate API (easiest to set up, just needs API key)
      async () => {
        const replicateApiKey = process.env.REPLICATE_API_TOKEN;
        if (!replicateApiKey) {
          throw new Error('SKIP'); // Skip silently if not configured
        }

        console.log('Attempting Replicate image generation...');
        
        // Use Stable Diffusion XL model via Replicate
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${replicateApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // stable-diffusion-xl model
            input: {
              prompt: enhancedPrompt,
              num_outputs: 1,
              aspect_ratio: '1:1',
              negative_prompt: 'blurry, low quality, distorted, watermark, text',
            },
          }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            const errorText = await response.text();
            errorData = { error: errorText };
          }
          throw new Error(`Replicate API error: ${errorData.error || errorData.detail || 'Unknown error'}`);
        }

        const prediction = await response.json();
        const predictionId = prediction.id;

        // Poll for completion (Replicate is async)
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          
          const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
              'Authorization': `Token ${replicateApiKey}`,
            },
          });

          const statusData = await statusResponse.json();

          if (statusData.status === 'succeeded') {
            const imageUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
            
            // Download the image and convert to base64
            const imageResponse = await fetch(imageUrl);
            const imageBlob = await imageResponse.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            console.log('Successfully received image from Replicate');
            return buffer.toString('base64');
          } else if (statusData.status === 'failed') {
            throw new Error(`Replicate prediction failed: ${statusData.error || 'Unknown error'}`);
          }
          
          attempts++;
        }

        throw new Error('Replicate prediction timed out');
      },
      
      // Service 2: Vertex AI Imagen
      async () => {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS;

        if (!projectId || !credentialsJson) {
          throw new Error('SKIP'); // Skip silently if not configured
        }

        try {
          // Parse credentials JSON
          let credentials;
          try {
            credentials = JSON.parse(credentialsJson);
          } catch (parseError) {
            throw new Error('Invalid credentials JSON format. Make sure GOOGLE_CLOUD_CREDENTIALS is valid JSON.');
          }

          console.log(`Attempting Vertex AI image generation with project ${projectId}...`);

          // Get access token using service account credentials
          const auth = new GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          });

          const client = await auth.getClient();
          const accessToken = await client.getAccessToken();

          if (!accessToken.token) {
            throw new Error('Failed to get access token from Google Cloud credentials');
          }

          // Vertex AI Imagen REST API endpoint
          const apiEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

          const requestBody = {
            instances: [
              {
                prompt: enhancedPrompt,
              },
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: '1:1',
              negativePrompt: 'blurry, low quality, distorted, watermark',
            },
          };

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          console.log(`Vertex AI response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText.substring(0, 200) };
            }

            if (response.status === 401 || response.status === 403) {
              throw new Error('Vertex AI authentication failed. Check your credentials and permissions.');
            }
            if (response.status === 404) {
              throw new Error('Vertex AI model not found. Make sure Imagen API is enabled in your project.');
            }
            if (response.status === 429) {
              throw new Error('Vertex AI quota exceeded. Please check your Google Cloud quotas.');
            }

            throw new Error(`Vertex AI API error: ${errorData.error?.message || errorData.error || errorText.substring(0, 200)}`);
          }

          const data = await response.json();

          console.log('Vertex AI response structure:', JSON.stringify(data).substring(0, 1000));

          if (!data.predictions || data.predictions.length === 0) {
            throw new Error('Vertex AI returned no predictions');
          }

          const prediction = data.predictions[0];
          
          // Vertex AI can return images in different formats
          let base64Image: string | undefined;
          
          // Try different possible response formats
          if (prediction.bytesBase64Encoded) {
            base64Image = prediction.bytesBase64Encoded;
          } else if (prediction.generatedImages && Array.isArray(prediction.generatedImages) && prediction.generatedImages.length > 0) {
            // Format: { generatedImages: [{ bytesBase64Encoded: "..." }] }
            const imageData = prediction.generatedImages[0];
            if (imageData.bytesBase64Encoded) {
              base64Image = imageData.bytesBase64Encoded;
            } else if (imageData.imageBytes) {
              base64Image = imageData.imageBytes;
            }
          } else if (prediction.imageBytes) {
            base64Image = prediction.imageBytes;
          } else if (prediction.bytes) {
            base64Image = prediction.bytes;
          } else if (typeof prediction === 'string') {
            // Sometimes the prediction itself is the base64 string
            base64Image = prediction;
          }

          if (base64Image) {
            // Clean the base64 string (remove any whitespace/newlines)
            const cleanedBase64 = String(base64Image).replace(/\s/g, '').trim();
            
            if (!cleanedBase64 || cleanedBase64.length === 0) {
              throw new Error('Vertex AI returned empty image data');
            }
            
            console.log('Successfully received image from Vertex AI, base64 length:', cleanedBase64.length);
            return cleanedBase64;
          }

          // Log the prediction structure for debugging
          console.error('Vertex AI response format not recognized.');
          console.error('Prediction keys:', Object.keys(prediction));
          console.error('Full prediction:', JSON.stringify(prediction).substring(0, 1000));
          throw new Error(`Vertex AI response format not recognized. Prediction keys: ${Object.keys(prediction).join(', ')}`);
        } catch (err: any) {
          console.error('Vertex AI error:', err);
          
          // Provide helpful error messages
          if (err.message?.includes('credentials') || err.message?.includes('authentication')) {
            throw new Error(`Vertex AI credentials error: ${err.message}`);
          }
          if (err.message?.includes('permission') || err.message?.includes('403')) {
            throw new Error('Vertex AI permission denied. Check that your service account has Vertex AI User role.');
          }
          if (err.message?.includes('not found') || err.message?.includes('404')) {
            throw new Error('Vertex AI model not found. Make sure Imagen API is enabled in your project.');
          }
          if (err.message?.includes('quota') || err.message?.includes('429')) {
            throw new Error('Vertex AI quota exceeded. Please check your Google Cloud quotas.');
          }
          
          throw new Error(`Vertex AI error: ${err.message || 'Unknown error'}`);
        }
      },
      
      // Service 2: Hugging Face Stable Diffusion with API key (try router endpoint first)
      async () => {
        const hfApiKey = process.env.HUGGINGFACE_API_KEY;
        if (!hfApiKey) {
          throw new Error('Hugging Face API key not configured');
        }

        // Try different endpoint formats - Hugging Face has changed their API structure
        const endpoints = [
          // Try the new router format (may vary by region/model)
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          // Alternative: Try with different model that might be available
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
          'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting Hugging Face image generation at ${endpoint}...`);
            const hfResponse = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${hfApiKey}`,
                'Content-Type': 'application/json',
              },
              method: 'POST',
              body: JSON.stringify({
                inputs: enhancedPrompt,
                parameters: {
                  num_inference_steps: 50,
                  guidance_scale: 7.5,
                },
              }),
            });

            console.log(`Hugging Face response status: ${hfResponse.status}`);

            // Check if response is an image or an error
            const contentType = hfResponse.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              console.log('Successfully received image from Hugging Face');
              const imageBlob = await hfResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              return buffer.toString('base64');
            } else {
              // Check if this endpoint is deprecated
              const errorText = await hfResponse.text();
              if (errorText.includes('no longer supported') || errorText.includes('router.huggingface.co')) {
                console.log(`Endpoint ${endpoint} deprecated, trying next...`);
                continue; // Try next endpoint
              }
              
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText.substring(0, 200) };
              }
              
              console.error('Hugging Face error:', errorData);
              
              // Handle specific error cases
              if (errorData?.error?.includes('loading') || errorData?.estimated_time) {
                const waitTime = errorData.estimated_time ? ` (estimated wait: ${Math.ceil(errorData.estimated_time)}s)` : '';
                throw new Error(`Model is loading${waitTime}. Please try again in a moment.`);
              }
              
              if (hfResponse.status === 401 || hfResponse.status === 403) {
                throw new Error('Invalid Hugging Face API key. Please check your API key in .env.local');
              }
              
              if (hfResponse.status === 429) {
                throw new Error('Hugging Face rate limit exceeded. Please wait a moment and try again.');
              }
              
              if (errorData?.error) {
                throw new Error(`Hugging Face API error: ${errorData.error}`);
              }
              
              throw new Error(`Hugging Face returned error (status ${hfResponse.status}): ${errorText.substring(0, 200)}`);
            }
          } catch (err: any) {
            // If not the last endpoint, continue to next
            if (endpoint !== endpoints[endpoints.length - 1]) {
              console.log(`Endpoint ${endpoint} failed, trying next...`);
              continue;
            }
            throw err; // Re-throw if last endpoint
          }
        }
        throw new Error('All Hugging Face endpoints failed');
      },
      
      // Service 2: Try Hugging Face fallback model (try both endpoints)
      async () => {
        // Use a simpler, shorter prompt for fallback API
        const simplePrompt = enhancedPrompt.length > 300 
          ? enhancedPrompt.substring(0, 300) 
          : enhancedPrompt;
        
        const hfApiKey = process.env.HUGGINGFACE_API_KEY;
        const endpoints = [
          // Try different models that might still work
          'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
          'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
          'https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4',
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting Hugging Face fallback at ${endpoint}...`);
            const hfResponse = await fetch(endpoint, {
              headers: {
                'Content-Type': 'application/json',
                ...(hfApiKey ? { Authorization: `Bearer ${hfApiKey}` } : {}),
              },
              method: 'POST',
              body: JSON.stringify({
                inputs: simplePrompt,
              }),
            });

            console.log(`Fallback Hugging Face response status: ${hfResponse.status}`);

            const contentType = hfResponse.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              console.log('Successfully received image from Hugging Face fallback');
              const imageBlob = await hfResponse.blob();
              const arrayBuffer = await imageBlob.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              return buffer.toString('base64');
            } else {
              // Check if this endpoint is deprecated
              const errorText = await hfResponse.text();
              if (errorText.includes('no longer supported') || errorText.includes('router.huggingface.co')) {
                console.log(`Endpoint ${endpoint} deprecated, trying next...`);
                continue; // Try next endpoint
              }
              
              let errorData;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText.substring(0, 200) };
              }
              
              console.error('Fallback Hugging Face error:', errorData);
              
              // If model is loading, provide helpful message
              if (errorData?.error?.includes('loading') || errorData?.estimated_time) {
                const waitTime = errorData.estimated_time ? ` (estimated wait: ${Math.ceil(errorData.estimated_time)}s)` : '';
                throw new Error(`Model is loading${waitTime}. Please try again in a few moments.`);
              }
              
              if (hfResponse.status === 429) {
                throw new Error('Rate limit exceeded. Please set up a Hugging Face API key for better reliability.');
              }
              
              if (hfResponse.status === 401 || hfResponse.status === 403) {
                // If auth required and we don't have key, try next endpoint
                if (!hfApiKey && endpoint !== endpoints[endpoints.length - 1]) {
                  continue;
                }
                throw new Error('Authentication required. Please set up a Hugging Face API key.');
              }
              
              throw new Error(`Hugging Face API error: ${errorData?.error || errorText.substring(0, 200)}`);
            }
          } catch (err: any) {
            // If not the last endpoint, continue to next
            if (endpoint !== endpoints[endpoints.length - 1]) {
              console.log(`Endpoint ${endpoint} failed, trying next...`);
              continue;
            }
            throw err; // Re-throw if last endpoint
          }
        }
        throw new Error('All Hugging Face fallback endpoints failed');
      },
    ];

    // Try each image generation service
    const errors: string[] = [];
    for (let i = 0; i < imageServices.length; i++) {
      try {
        const base64Image = await imageServices[i]();
        
        // Ensure base64 string is clean (no whitespace)
        const cleanedBase64 = base64Image.replace(/\s/g, '');
        
        // Validate base64 format
        if (!cleanedBase64 || cleanedBase64.length === 0) {
          throw new Error('Received empty image data');
        }
        
        console.log(`Image generation service ${i + 1} succeeded, image length: ${cleanedBase64.length}`);
        
        return NextResponse.json({
          success: true,
          image: cleanedBase64,
          mimeType: 'image/png',
          prompt: enhancedPrompt,
        });
      } catch (imageError: any) {
        const errorMsg = imageError.message || 'Unknown error';
        // Skip silently if service is not configured
        if (errorMsg === 'SKIP') {
          console.log(`Image generation service ${i + 1} skipped (not configured)`);
          continue;
        }
        errors.push(errorMsg);
        console.error(`Image generation service ${i + 1} failed:`, errorMsg);
        // Continue to next service
      }
    }

    // Fallback: Return prompt if image generation fails
    const hasHuggingFaceKey = !!process.env.HUGGINGFACE_API_KEY;
    const hasReplicateKey = !!process.env.REPLICATE_API_TOKEN;
    const hasVertexAI = !!process.env.GOOGLE_CLOUD_PROJECT_ID && !!process.env.GOOGLE_CLOUD_CREDENTIALS;
    const lastError = errors[errors.length - 1] || 'Unknown error';
    
    // Check if all errors are about deprecated endpoints or not configured
    const allDeprecated = errors.every(e => e.includes('no longer supported') || e.includes('410'));
    const allNotFound = errors.every(e => e.includes('Not Found') || e.includes('404'));
    const allNotConfigured = errors.every(e => 
      e.includes('not configured') || 
      e.includes('not found') || 
      e.includes('requires') ||
      e.includes('Set ')
    );
    
    let note = '';
    let setupInstructions = '';
    
    // If no services are configured, provide clear setup instructions
    if (!hasReplicateKey && !hasVertexAI && !hasHuggingFaceKey) {
      setupInstructions = `**No image generation service configured.**\n\n`;
      setupInstructions += `**Quick Setup (Recommended - Takes 2 minutes):**\n`;
      setupInstructions += `1. Go to https://replicate.com/account/api-tokens\n`;
      setupInstructions += `2. Sign up/login and create an API token\n`;
      setupInstructions += `3. Copy the token (starts with r8_...)\n`;
      setupInstructions += `4. Add this line to your .env.local file:\n`;
      setupInstructions += `   REPLICATE_API_TOKEN=r8_your_token_here\n`;
      setupInstructions += `5. Restart your development server\n`;
      setupInstructions += `6. Try generating again!\n\n`;
      setupInstructions += `See REPLICATE_SETUP.md for detailed instructions.`;
      
      note = setupInstructions;
    } else if (allDeprecated || allNotFound || allNotConfigured) {
      note = `Image generation services are not properly configured. `;
      if (!hasReplicateKey && !hasVertexAI) {
        note += setupInstructions || `Set up Replicate API (easiest) - see REPLICATE_SETUP.md for instructions.`;
      } else {
        note += `Check your API keys and configuration. Errors: ${errors.join('; ')}`;
      }
    } else {
      note = hasReplicateKey || hasVertexAI || hasHuggingFaceKey
        ? `Image generation failed: ${lastError}. Please check your API configuration and try again. The prompt above can be used with other image generation tools.`
        : `Image generation requires an API key. Set up Replicate (easiest) or Vertex AI. See REPLICATE_SETUP.md for instructions.`;
    }
    
    return NextResponse.json({
      success: true,
      prompt: enhancedPrompt,
      note: note,
      imageGenerationAvailable: false,
      needsSetup: !hasReplicateKey && !hasVertexAI && !hasHuggingFaceKey,
      setupInstructions: setupInstructions,
      errors: errors,
      hugginFaceApiDeprecated: allDeprecated || allNotFound,
    });
  } catch (error: any) {
    console.error('Error generating tattoo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tattoo' },
      { status: 500 }
    );
  }
}

