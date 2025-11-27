'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tattoo, FilterSet } from '@/types';
import { getTattoos, addFilterSet } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ExperienceLevel = 'beginner' | 'somewhat-known' | 'known' | null;
type QuestionStep = 'experience' | 'style-intro' | 'style' | 'bodyPart' | 'placement-education' | 'color' | 'size' | 'size-education' | 'combining-education' | 'artist-tips' | 'complete';

// Style descriptions for educational purposes
const STYLE_DESCRIPTIONS: Record<string, string> = {
  'Black & Grey Realism': 'Photorealistic tattoos in shades of black and grey, capturing fine details and depth.',
  'Color Realism': 'Vibrant, photorealistic tattoos using full color palettes to create lifelike images.',
  'Portraits': 'Detailed portraits of people, animals, or faces, often in black & grey or color realism.',
  'American Traditional': 'Bold outlines, limited color palette, and classic designs like anchors, roses, and eagles.',
  'Japanese (Irezumi)': 'Traditional Japanese art with dragons, koi fish, cherry blossoms, and flowing compositions.',
  'Tribal / Polynesian': 'Bold black patterns inspired by indigenous cultures, often geometric and flowing.',
  'Fine Line': 'Delicate, thin lines creating intricate designs with minimal shading.',
  'Minimalist': 'Simple, clean designs with minimal elements - perfect for first tattoos.',
  'Single Needle': 'Ultra-fine lines created with a single needle for delicate, detailed work.',
  'Watercolor': 'Soft, flowing colors that mimic watercolor paintings with blended edges.',
  'Abstract / Sketch': 'Artistic, unfinished-looking designs that appear hand-drawn or sketched.',
  'Geometric / Dotwork': 'Precise geometric patterns, mandalas, and dotwork creating intricate designs.',
  'Neo-Traditional': 'Modern take on traditional tattoos with more colors, depth, and detail.',
  'New School': 'Bold, cartoon-like designs with bright colors and exaggerated features.',
  'Cartoon / Anime': 'Playful designs inspired by cartoons, anime, and pop culture characters.',
};

export function BeginnersQuestionnaire() {
  const router = useRouter();
  const { user } = useAuth();
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(null);
  const [currentStep, setCurrentStep] = useState<QuestionStep>('experience');
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [preferences, setPreferences] = useState<Omit<FilterSet, 'id' | 'name' | 'createdAt' | 'updatedAt'>>({
    styles: [],
    bodyParts: [],
    colorPreference: null,
    sizePreference: null,
  });

  useEffect(() => {
    const loadTattoos = async () => {
      try {
        const tattoosData = await getTattoos();
        setTattoos(tattoosData.filter(t => t.isVisible !== false));
      } catch (err) {
        console.error('Error loading tattoos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTattoos();
  }, []);

  // Get unique styles and body parts from tattoos
  const availableStyles = useMemo(() => {
    return Array.from(new Set(tattoos.map(t => t.style).filter(Boolean))) as string[];
  }, [tattoos]);

  const availableBodyParts = useMemo(() => {
    return Array.from(new Set(tattoos.map(t => t.bodyPart).filter(Boolean))) as string[];
  }, [tattoos]);

  // Filter tattoos for current question
  const getFilteredTattoos = (step: QuestionStep): Tattoo[] => {
    switch (step) {
      case 'style':
        return tattoos.filter(t => t.style && availableStyles.includes(t.style));
      case 'bodyPart':
        return tattoos.filter(t => t.bodyPart && availableBodyParts.includes(t.bodyPart));
      case 'color':
        return tattoos;
      case 'size':
        return tattoos;
      default:
        return [];
    }
  };

  const handleExperienceSelect = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    // For beginners, show style intro. For others, go straight to style selection
    if (level === 'beginner') {
      setCurrentStep('style-intro');
    } else {
      setCurrentStep('style');
    }
  };

  const handleStyleSelect = (style: string) => {
    setPreferences(prev => {
      const newStyles = prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style];
      return { ...prev, styles: newStyles };
    });
  };

  const handleBodyPartSelect = (bodyPart: string) => {
    setPreferences(prev => {
      const newBodyParts = prev.bodyParts.includes(bodyPart)
        ? prev.bodyParts.filter(b => b !== bodyPart)
        : [...prev.bodyParts, bodyPart];
      return { ...prev, bodyParts: newBodyParts };
    });
  };

  const handleColorSelect = (preference: 'color' | 'bw' | 'both') => {
    setPreferences(prev => ({ ...prev, colorPreference: preference }));
  };

  const handleSizeSelect = (preference: 'small' | 'medium' | 'large' | 'all') => {
    setPreferences(prev => ({ ...prev, sizePreference: preference }));
  };

  const handleNext = () => {
    // Build steps array based on experience level
    let steps: QuestionStep[];
    if (experienceLevel === 'beginner') {
      steps = ['experience', 'style-intro', 'style', 'bodyPart', 'placement-education', 'color', 'size', 'size-education', 'combining-education', 'artist-tips', 'complete'];
    } else if (experienceLevel === 'somewhat-known') {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size', 'artist-tips', 'complete'];
    } else {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size', 'complete'];
    }
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    let steps: QuestionStep[];
    if (experienceLevel === 'beginner') {
      steps = ['experience', 'style-intro', 'style', 'bodyPart', 'placement-education', 'color', 'size', 'size-education', 'combining-education', 'artist-tips', 'complete'];
    } else if (experienceLevel === 'somewhat-known') {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size', 'artist-tips', 'complete'];
    } else {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size', 'complete'];
    }
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!filterName.trim()) {
      alert('Please enter a name for this filter set');
      return;
    }

    setSaving(true);
    try {
      if (user?.uid) {
        await addFilterSet(user.uid, {
          name: filterName.trim(),
          ...preferences,
        });
      }
      
      localStorage.setItem('tattooPreferences', JSON.stringify(preferences));
      router.push('/?beginners=true');
    } catch (err) {
      console.error('Error saving preferences:', err);
      localStorage.setItem('tattooPreferences', JSON.stringify(preferences));
      router.push('/?beginners=true');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'experience':
        return experienceLevel !== null;
      case 'style-intro':
      case 'placement-education':
      case 'size-education':
      case 'combining-education':
      case 'artist-tips':
        return true; // Educational steps, can always proceed
      case 'style':
        return preferences.styles.length > 0;
      case 'bodyPart':
        return preferences.bodyParts.length > 0;
      case 'color':
        return preferences.colorPreference !== null;
      case 'size':
        return preferences.sizePreference !== null;
      default:
        return false;
    }
  };

  const getStepProgress = () => {
    let steps: QuestionStep[];
    if (experienceLevel === 'beginner') {
      steps = ['experience', 'style-intro', 'style', 'bodyPart', 'placement-education', 'color', 'size', 'size-education', 'combining-education', 'artist-tips'];
    } else if (experienceLevel === 'somewhat-known') {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size', 'artist-tips'];
    } else {
      steps = ['experience', 'style', 'bodyPart', 'color', 'size'];
    }
    
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex === -1) return 100; // Complete
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent mx-auto"></div>
          <p className="text-black/60 text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredTattoos = getFilteredTattoos(currentStep);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-light tracking-[0.15em] text-black uppercase">
                Tattoo Compass
              </h1>
              <p className="mt-1.5 text-xs text-black/40 tracking-wide">
                Understand styles, explore ideas, prepare calmly
              </p>
            </div>
            <Link
              href="/"
              className="text-xs text-black/40 hover:text-black transition-colors duration-200 uppercase tracking-[0.1em]"
            >
              Skip
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== 'experience' && (
        <div className="border-b border-black/10 bg-white">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="h-1 bg-black/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Experience Level Question */}
          {currentStep === 'experience' && (
            <ExperienceLevelSelection onSelect={handleExperienceSelect} selected={experienceLevel} />
          )}

          {/* Style Introduction (for beginners only) */}
          {currentStep === 'style-intro' && (
            <StyleIntroduction onContinue={handleNext} />
          )}

          {/* Question Headers */}
          {currentStep === 'style' && (
            <>
              <div className="mb-10 sm:mb-14 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
                  {experienceLevel === 'beginner' 
                    ? 'Let\'s explore different tattoo styles'
                    : 'What style appeals to you?'}
                </h2>
                <p className="text-sm text-black/50 tracking-wide max-w-2xl mx-auto">
                  {experienceLevel === 'beginner'
                    ? 'Take your time to browse through different styles. There\'s no rush - explore what speaks to you.'
                    : 'Select one or more styles that catch your eye'}
                </p>
              </div>
              <StyleSelection
                styles={availableStyles}
                tattoos={filteredTattoos}
                selectedStyles={preferences.styles}
                onSelect={handleStyleSelect}
                showDescriptions={experienceLevel === 'beginner'}
              />
            </>
          )}

          {currentStep === 'bodyPart' && (
            <>
              <div className="mb-10 sm:mb-14 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
                  Where would you like your tattoo?
                </h2>
                <p className="text-sm text-black/50 tracking-wide">
                  {experienceLevel === 'beginner'
                    ? 'Consider placement carefully. Some areas are more visible, others more private. Both are valid choices.'
                    : 'Choose the body parts you\'re considering'}
                </p>
              </div>
              <BodyPartSelection
                bodyParts={availableBodyParts}
                tattoos={filteredTattoos}
                selectedBodyParts={preferences.bodyParts}
                onSelect={handleBodyPartSelect}
              />
            </>
          )}

          {currentStep === 'placement-education' && experienceLevel === 'beginner' && (
            <PlacementEducation onContinue={handleNext} />
          )}

          {currentStep === 'size-education' && experienceLevel === 'beginner' && (
            <SizeEducation onContinue={handleNext} />
          )}

          {currentStep === 'combining-education' && experienceLevel === 'beginner' && (
            <CombiningEducation onContinue={handleNext} />
          )}

          {currentStep === 'artist-tips' && (
            <ArtistTips 
              onContinue={handleNext} 
              experienceLevel={experienceLevel}
            />
          )}

          {currentStep === 'color' && (
            <>
              <div className="mb-10 sm:mb-14 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
                  Color or black & white?
                </h2>
                <p className="text-sm text-black/50 tracking-wide">
                  {experienceLevel === 'beginner'
                    ? 'Both have their beauty. Color tattoos are vibrant and eye-catching. Black & white tattoos are timeless and classic.'
                    : 'What appeals to you more?'}
                </p>
              </div>
              <ColorSelection
                tattoos={filteredTattoos}
                selected={preferences.colorPreference}
                onSelect={handleColorSelect}
              />
            </>
          )}

          {currentStep === 'size' && (
            <>
              <div className="mb-10 sm:mb-14 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
                  What size are you thinking?
                </h2>
                <p className="text-sm text-black/50 tracking-wide">
                  {experienceLevel === 'beginner'
                    ? 'Size affects both visibility and detail. Smaller tattoos are subtle, larger ones allow for more intricate designs.'
                    : 'Select your preferred tattoo size'}
                </p>
              </div>
              <SizeSelection
                selected={preferences.sizePreference}
                onSelect={handleSizeSelect}
              />
            </>
          )}

          {currentStep === 'complete' && (
            <>
              <div className="mb-10 sm:mb-14 text-center">
                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
                  Almost there!
                </h2>
                <p className="text-sm text-black/50 tracking-wide">
                  Give your preferences a name so you can find them later
                </p>
              </div>
              <CompletionView
                preferences={preferences}
                filterName={filterName}
                onFilterNameChange={setFilterName}
              />
            </>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'complete' && currentStep !== 'experience' && (
            <div className="mt-12 flex flex-col sm:flex-row gap-4 sm:justify-between">
              <button
                onClick={handleBack}
                className="rounded-full border border-black px-6 py-3 text-xs font-medium text-black transition-all duration-200 hover:bg-black hover:text-white active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="rounded-full bg-black px-6 py-3 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {currentStep === 'style-intro' ? 'Start Exploring' : 'Continue'}
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="mt-12 flex flex-col items-center gap-4">
              {user && (
                <p className="text-xs text-black/50 tracking-wide text-center">
                  Your preferences will be saved to your profile
                </p>
              )}
              <button
                onClick={handleComplete}
                disabled={saving || !filterName.trim()}
                className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'View Matching Tattoos'
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Experience Level Selection Component
interface ExperienceLevelSelectionProps {
  selected: ExperienceLevel;
  onSelect: (level: ExperienceLevel) => void;
}

function ExperienceLevelSelection({ selected, onSelect }: ExperienceLevelSelectionProps) {
  return (
    <div className="text-center">
      <div className="mb-12">
        <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Welcome to Tattoo Compass
        </h2>
        <p className="text-base text-black/60 tracking-wide max-w-2xl mx-auto mb-6">
          We help you understand tattoo styles, explore ideas, and prepare designs calmly before going to a shop.
        </p>
        <p className="text-sm text-black/50 tracking-wide max-w-xl mx-auto">
          To personalize your journey, let us know your experience with tattoos
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <button
          onClick={() => onSelect('beginner')}
          className={`text-left border-2 transition-all duration-200 p-6 sm:p-8 ${
            selected === 'beginner'
              ? 'border-black bg-black/5'
              : 'border-black/10 hover:border-black/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-light text-black">True Beginner</h3>
            {selected === 'beginner' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-sm text-black/50 leading-relaxed">
            I'm new to tattoos and want to learn about different styles and what's possible. Take your time teaching me.
          </p>
        </button>

        <button
          onClick={() => onSelect('somewhat-known')}
          className={`text-left border-2 transition-all duration-200 p-6 sm:p-8 ${
            selected === 'somewhat-known'
              ? 'border-black bg-black/5'
              : 'border-black/10 hover:border-black/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-light text-black">Somewhat Known</h3>
            {selected === 'somewhat-known' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-sm text-black/50 leading-relaxed">
            I have some knowledge about tattoos but want to explore more options and refine my preferences.
          </p>
        </button>

        <button
          onClick={() => onSelect('known')}
          className={`text-left border-2 transition-all duration-200 p-6 sm:p-8 ${
            selected === 'known'
              ? 'border-black bg-black/5'
              : 'border-black/10 hover:border-black/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-light text-black">Known to Tattoos</h3>
            {selected === 'known' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-sm text-black/50 leading-relaxed">
            I'm familiar with tattoos and styles. I know what I'm looking for and want to find matching artists quickly.
          </p>
        </button>
      </div>
    </div>
  );
}

// Style Introduction Component (for beginners)
interface StyleIntroductionProps {
  onContinue: () => void;
}

function StyleIntroduction({ onContinue }: StyleIntroductionProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Learning Tattoo Style Names
        </h2>
        <div className="text-left space-y-6 text-base text-black/70 leading-relaxed">
          <p>
            One of the biggest challenges for beginners is not knowing the names of different tattoo styles. Learning these names will help you communicate better with artists and find what you're looking for.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black mb-2">Why Style Names Matter</h3>
              <p className="text-sm text-black/60">
                When you can say "I'm interested in American Traditional" instead of "I like those bold, colorful ones," artists immediately understand what you want. It makes consultations faster and more effective.
              </p>
            </div>
            
            <p>
              <strong className="text-black">Realistic styles</strong> capture lifelike details, from portraits to nature scenes. They can be in black & grey for a classic look, or in full color for vibrant impact. <strong>These age well</strong> because of their strong contrast and detail.
            </p>
            
            <p>
              <strong className="text-black">Traditional styles</strong> like American Traditional and Japanese (Irezumi) have rich histories and bold, recognizable aesthetics. They're <strong>timeless choices that age beautifully</strong> - these styles were designed to last, with bold lines and solid colors.
            </p>
            
            <p>
              <strong className="text-black">Minimalist and fine line</strong> styles are perfect for first tattoos - delicate, subtle, and elegant. They use thin lines and simple designs. <strong>Note:</strong> Very fine lines may soften slightly over time, which is natural.
            </p>
            
            <p>
              <strong className="text-black">Artistic styles</strong> like watercolor, abstract, and geometric work are more experimental and creative, allowing for unique, personalized designs. These can be stunning, but may require more maintenance over time.
            </p>
          </div>
          
          <p className="pt-4 border-t border-black/10">
            As we explore, you'll learn the names of each style. This knowledge will help you have better conversations with artists and find exactly what you're looking for. Take your time - there's no rush.
          </p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
      >
        Start Exploring Styles
      </button>
    </div>
  );
}

// Style Selection Component
interface StyleSelectionProps {
  styles: string[];
  tattoos: Tattoo[];
  selectedStyles: string[];
  onSelect: (style: string) => void;
  showDescriptions?: boolean;
}

function StyleSelection({ styles, tattoos, selectedStyles, onSelect, showDescriptions = false }: StyleSelectionProps) {
  const tattoosByStyle = useMemo(() => {
    const grouped = new Map<string, Tattoo[]>();
    styles.forEach(style => {
      const styleTattoos = tattoos.filter(t => t.style === style).slice(0, 6);
      if (styleTattoos.length > 0) {
        grouped.set(style, styleTattoos);
      }
    });
    return grouped;
  }, [styles, tattoos]);

  return (
    <div className="space-y-8">
      {styles.map(style => {
        const styleTattoos = tattoosByStyle.get(style) || [];
        const isSelected = selectedStyles.includes(style);
        const description = STYLE_DESCRIPTIONS[style] || '';
        
        return (
          <button
            key={style}
            onClick={() => onSelect(style)}
            className={`w-full text-left border-2 transition-all duration-200 ${
              isSelected
                ? 'border-black bg-black/5'
                : 'border-black/10 hover:border-black/30'
            }`}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-light text-black mb-2">{style}</h3>
                  {showDescriptions && description && (
                    <p className="text-sm text-black/50 leading-relaxed mb-4">
                      {description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0 ml-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {styleTattoos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {styleTattoos.map(tattoo => (
                    <div
                      key={tattoo.id}
                      className="relative aspect-square overflow-hidden bg-black"
                    >
                      <Image
                        src={tattoo.imageUrl}
                        alt={tattoo.description || style}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 16vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Body Part Selection Component
interface BodyPartSelectionProps {
  bodyParts: string[];
  tattoos: Tattoo[];
  selectedBodyParts: string[];
  onSelect: (bodyPart: string) => void;
}

function BodyPartSelection({ bodyParts, tattoos, selectedBodyParts, onSelect }: BodyPartSelectionProps) {
  const tattoosByBodyPart = useMemo(() => {
    const grouped = new Map<string, Tattoo[]>();
    bodyParts.forEach(bodyPart => {
      const partTattoos = tattoos.filter(t => t.bodyPart === bodyPart).slice(0, 6);
      if (partTattoos.length > 0) {
        grouped.set(bodyPart, partTattoos);
      }
    });
    return grouped;
  }, [bodyParts, tattoos]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {bodyParts.map(bodyPart => {
        const partTattoos = tattoosByBodyPart.get(bodyPart) || [];
        const isSelected = selectedBodyParts.includes(bodyPart);
        
        return (
          <button
            key={bodyPart}
            onClick={() => onSelect(bodyPart)}
            className={`text-left border-2 transition-all duration-200 ${
              isSelected
                ? 'border-black bg-black/5'
                : 'border-black/10 hover:border-black/30'
            }`}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-light text-black">{bodyPart}</h3>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {partTattoos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {partTattoos.slice(0, 3).map(tattoo => (
                    <div
                      key={tattoo.id}
                      className="relative aspect-square overflow-hidden bg-black"
                    >
                      <Image
                        src={tattoo.imageUrl}
                        alt={tattoo.description || bodyPart}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 16vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Color Selection Component
interface ColorSelectionProps {
  tattoos: Tattoo[];
  selected: 'color' | 'bw' | 'both' | null;
  onSelect: (preference: 'color' | 'bw' | 'both') => void;
}

function ColorSelection({ tattoos, selected, onSelect }: ColorSelectionProps) {
  const colorTattoos = useMemo(() => {
    return tattoos.filter(t => t.color === true).slice(0, 6);
  }, [tattoos]);

  const bwTattoos = useMemo(() => {
    return tattoos.filter(t => t.color === false).slice(0, 6);
  }, [tattoos]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        onClick={() => onSelect('color')}
        className={`text-left border-2 transition-all duration-200 ${
          selected === 'color'
            ? 'border-black bg-black/5'
            : 'border-black/10 hover:border-black/30'
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-light text-black">Color</h3>
            {selected === 'color' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {colorTattoos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {colorTattoos.slice(0, 4).map(tattoo => (
                <div
                  key={tattoo.id}
                  className="relative aspect-square overflow-hidden bg-black"
                >
                  <Image
                    src={tattoo.imageUrl}
                    alt={tattoo.description || 'Color tattoo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 16vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </button>

      <button
        onClick={() => onSelect('bw')}
        className={`text-left border-2 transition-all duration-200 ${
          selected === 'bw'
            ? 'border-black bg-black/5'
            : 'border-black/10 hover:border-black/30'
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-light text-black">Black & White</h3>
            {selected === 'bw' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {bwTattoos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {bwTattoos.slice(0, 4).map(tattoo => (
                <div
                  key={tattoo.id}
                  className="relative aspect-square overflow-hidden bg-black"
                >
                  <Image
                    src={tattoo.imageUrl}
                    alt={tattoo.description || 'Black & white tattoo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 16vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </button>

      <button
        onClick={() => onSelect('both')}
        className={`text-left border-2 transition-all duration-200 ${
          selected === 'both'
            ? 'border-black bg-black/5'
            : 'border-black/10 hover:border-black/30'
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-light text-black">Both</h3>
            {selected === 'both' && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-black/50 tracking-wide">
            I'm open to both color and black & white tattoos
          </p>
        </div>
      </button>
    </div>
  );
}

// Size Selection Component
interface SizeSelectionProps {
  selected: 'small' | 'medium' | 'large' | 'all' | null;
  onSelect: (preference: 'small' | 'medium' | 'large' | 'all') => void;
}

function SizeSelection({ selected, onSelect }: SizeSelectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {(['small', 'medium', 'large', 'all'] as const).map(size => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={`text-left border-2 transition-all duration-200 p-6 sm:p-8 ${
            selected === size
              ? 'border-black bg-black/5'
              : 'border-black/10 hover:border-black/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-light text-black capitalize">
              {size === 'all' ? 'All Sizes' : size}
            </h3>
            {selected === size && (
              <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-black/50 tracking-wide">
            {size === 'small' && 'Small tattoos (e.g., wrist, ankle, behind ear)'}
            {size === 'medium' && 'Medium tattoos (e.g., forearm, calf, shoulder)'}
            {size === 'large' && 'Large tattoos (e.g., full sleeve, back piece, leg piece)'}
            {size === 'all' && 'I\'m open to all tattoo sizes'}
          </p>
        </button>
      ))}
    </div>
  );
}

// Placement Education Component (for beginners)
interface PlacementEducationProps {
  onContinue: () => void;
}

function PlacementEducation({ onContinue }: PlacementEducationProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Understanding Tattoo Placement
        </h2>
        <div className="text-left space-y-6 text-base text-black/70 leading-relaxed">
          <p>
            Where you place your tattoo matters. Different body parts have different characteristics that affect both the design and your experience.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black mb-2">Visible vs. Private Areas</h3>
              <p className="text-sm text-black/60">
                <strong>Visible areas</strong> (arms, hands, neck) let you show off your tattoo, but consider your profession and lifestyle. <strong>Private areas</strong> (back, chest, legs) give you more control over when it's seen.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Pain Levels</h3>
              <p className="text-sm text-black/60">
                Areas with more muscle or fat (thighs, upper arms) tend to be less painful. Bony areas (ankles, ribs, spine) can be more sensitive. This is normal and temporary.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">How Placement Affects Design</h3>
              <p className="text-sm text-black/60">
                Curved areas (forearms, calves) work well for flowing designs. Flat areas (back, chest) are perfect for larger, detailed pieces. Your artist will help you understand what works best for your chosen placement.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Aging Considerations</h3>
              <p className="text-sm text-black/60">
                Areas that move or stretch (joints, stomach) may change more over time. Areas with stable skin (back, shoulders) tend to age more gracefully. This is natural and happens to all tattoos.
              </p>
            </div>
          </div>
          
          <p className="pt-4 border-t border-black/10">
            Remember: there's no "wrong" placement. Choose what feels right for you and your lifestyle.
          </p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
      >
        Continue
      </button>
    </div>
  );
}

// Size Education Component (for beginners)
interface SizeEducationProps {
  onContinue: () => void;
}

function SizeEducation({ onContinue }: SizeEducationProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Understanding Tattoo Sizes
        </h2>
        <div className="text-left space-y-6 text-base text-black/70 leading-relaxed">
          <p>
            Size matters when it comes to tattoos. Understanding realistic expectations helps you communicate better with your artist.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black mb-2">Small Tattoos (2-4 inches)</h3>
              <p className="text-sm text-black/60">
                Perfect for simple designs, symbols, or text. Great for first tattoos. Keep designs simple - too much detail in a small space can blur over time. Examples: wrist tattoos, behind the ear, small ankle pieces.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Medium Tattoos (4-8 inches)</h3>
              <p className="text-sm text-black/60">
                Allows for more detail and complexity. Good balance between visibility and subtlety. Examples: forearm pieces, calf tattoos, shoulder designs. This is often the sweet spot for detailed work.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Large Tattoos (8+ inches)</h3>
              <p className="text-sm text-black/60">
                Full sleeves, back pieces, leg pieces. These allow for the most detail and complexity. They're investments in both time and money, often requiring multiple sessions. Perfect for intricate designs, portraits, or large-scale artwork.
              </p>
            </div>
            
            <div className="bg-black/5 p-4 border-l-2 border-black">
              <h3 className="font-medium text-black mb-2">Important to Know</h3>
              <p className="text-sm text-black/60">
                <strong>Detail needs space.</strong> If you want fine details, portraits, or complex designs, you'll need a larger tattoo. Trying to fit too much detail into a small space can lead to blurring as the tattoo ages. Your artist will guide you on what's realistic for your desired size.
              </p>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
      >
        Continue
      </button>
    </div>
  );
}

// Combining Images Education Component (for beginners)
interface CombiningEducationProps {
  onContinue: () => void;
}

function CombiningEducation({ onContinue }: CombiningEducationProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          Combining Multiple Ideas
        </h2>
        <div className="text-left space-y-6 text-base text-black/70 leading-relaxed">
          <p>
            Many people want to combine multiple images or ideas into one tattoo. This is absolutely possible, but there are some things to consider.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black mb-2">Style Consistency</h3>
              <p className="text-sm text-black/60">
                Combining elements works best when they share a similar style. For example, mixing realistic and cartoon styles in one piece can look disjointed. Your artist can help create a cohesive design that brings your ideas together.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Size Requirements</h3>
              <p className="text-sm text-black/60">
                Multiple elements need more space. A design with several images will need to be larger to maintain detail and clarity. This is where working with your artist becomes crucial - they'll help you understand what's possible.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Composition & Flow</h3>
              <p className="text-sm text-black/60">
                Good tattoo artists are experts at composition. They know how to arrange multiple elements so they flow together naturally and work with your body's curves. Trust their expertise - they'll create something better than just placing images side by side.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">The Design Process</h3>
              <p className="text-sm text-black/60">
                Bring reference images, but be open to your artist's suggestions. They might combine elements in ways you hadn't considered, creating a more cohesive and beautiful design. Collaboration is key.
              </p>
            </div>
          </div>
          
          <p className="pt-4 border-t border-black/10">
            Remember: A good artist will help you combine ideas into a cohesive design that works as a whole, not just a collection of separate images.
          </p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
      >
        Continue
      </button>
    </div>
  );
}

// Artist Tips Component
interface ArtistTipsProps {
  onContinue: () => void;
  experienceLevel: ExperienceLevel;
}

function ArtistTips({ onContinue, experienceLevel }: ArtistTipsProps) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="mb-6 text-2xl sm:text-3xl md:text-4xl font-light tracking-[-0.02em] text-black">
          How to Talk to Artists
        </h2>
        <div className="text-left space-y-6 text-base text-black/70 leading-relaxed">
          <p>
            Good communication with your tattoo artist is essential. Here's how to have productive conversations.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-black mb-2">Use Style Names</h3>
              <p className="text-sm text-black/60">
                Now that you know style names (like "American Traditional" or "Fine Line"), use them! Saying "I like bold, colorful tattoos with thick lines" is less clear than "I'm interested in American Traditional style." This helps artists understand exactly what you're looking for.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Bring Reference Images</h3>
              <p className="text-sm text-black/60">
                Images are worth a thousand words. Bring photos of tattoos you like, but also images of the subject matter (flowers, animals, etc.). Artists use these as inspiration, not to copy exactly.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Be Open to Suggestions</h3>
              <p className="text-sm text-black/60">
                Artists are professionals who understand how tattoos work on skin. If they suggest changes to size, placement, or design elements, listen. They're thinking about how it will look and age over time.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Ask Questions</h3>
              <p className="text-sm text-black/60">
                <strong>Good questions to ask:</strong> "How will this age over time?" "What size do you recommend for this level of detail?" "How long will this take?" "What's your process for designing?" There are no stupid questions - artists appreciate engaged clients.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-black mb-2">Discuss Budget & Timeline</h3>
              <p className="text-sm text-black/60">
                Be upfront about your budget. Artists can work within different price ranges and may suggest breaking a large piece into sessions. Also discuss timeline - good artists are often booked weeks or months in advance.
              </p>
            </div>
            
            {experienceLevel === 'beginner' && (
              <div className="bg-black/5 p-4 border-l-2 border-black">
                <h3 className="font-medium text-black mb-2">About Tattoo Aging</h3>
                <p className="text-sm text-black/60">
                  <strong>All tattoos change over time.</strong> Lines may soften slightly, colors may fade a bit. This is normal and natural. Bold designs with good contrast age better than very fine, delicate work. Your artist can explain how your chosen style typically ages. Don't worry - well-done tattoos look great for decades with proper care.
                </p>
              </div>
            )}
          </div>
          
          <p className="pt-4 border-t border-black/10">
            Remember: A good consultation is a conversation. You bring your ideas, they bring their expertise. Together, you create something amazing.
          </p>
        </div>
      </div>
      <button
        onClick={onContinue}
        className="rounded-full bg-black px-8 py-3.5 text-xs font-medium text-white transition-all duration-200 hover:bg-black/90 active:bg-black/95 uppercase tracking-[0.1em] min-h-[44px] touch-manipulation"
      >
        Continue
      </button>
    </div>
  );
}

// Completion View Component
interface CompletionViewProps {
  preferences: Omit<FilterSet, 'id' | 'name' | 'createdAt' | 'updatedAt'>;
  filterName: string;
  onFilterNameChange: (name: string) => void;
}

function CompletionView({ preferences, filterName, onFilterNameChange }: CompletionViewProps) {
  return (
    <div className="border border-black/10 bg-white p-8 sm:p-12">
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto text-black"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-light text-black mb-6 text-center">
        Save Your Preferences
      </h3>
      
      <div className="mb-6 max-w-md mx-auto">
        <label className="mb-3 block text-xs font-medium text-black/60 uppercase tracking-wider text-center">
          Give this filter set a name
        </label>
        <input
          type="text"
          value={filterName}
          onChange={(e) => onFilterNameChange(e.target.value)}
          placeholder="e.g., My First Tattoo, Bold & Colorful, etc."
          className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base text-black placeholder-black/30 focus:border-black focus:outline-none transition-colors duration-200 text-center"
        />
      </div>

      <div className="text-sm text-black/50 space-y-2 mb-8 text-center">
        {preferences.styles.length > 0 && (
          <p>Styles: {preferences.styles.join(', ')}</p>
        )}
        {preferences.bodyParts.length > 0 && (
          <p>Body Parts: {preferences.bodyParts.join(', ')}</p>
        )}
        {preferences.colorPreference && (
          <p>Color: {preferences.colorPreference === 'both' ? 'Both' : preferences.colorPreference === 'color' ? 'Color' : 'Black & White'}</p>
        )}
        {preferences.sizePreference && (
          <p>Size: {preferences.sizePreference === 'all' ? 'All Sizes' : preferences.sizePreference.charAt(0).toUpperCase() + preferences.sizePreference.slice(1)}</p>
        )}
      </div>
      <p className="text-xs text-black/40 tracking-wide text-center">
        We'll show you tattoos that match your preferences in the gallery
      </p>
    </div>
  );
}
