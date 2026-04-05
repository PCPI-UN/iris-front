'use client';

import { RefObject } from 'react';
import { landingContent } from '../content';

type StoryBlock = 'section1' | 'section2';

interface StorySectionsProps {
  storySection1Ref: RefObject<HTMLElement>;
  storySection2Ref: RefObject<HTMLElement>;
  storySection3Ref: RefObject<HTMLElement>;
  zoomTextRef: RefObject<HTMLDivElement>;
  layeredTextRef: RefObject<HTMLDivElement>;
  blocks?: StoryBlock[];
}

export function StorySections({
  storySection1Ref,
  storySection3Ref,
  blocks = ['section1', 'section2'],
}: StorySectionsProps) {
  return (
    <>
      {blocks.includes('section1') && (
        <section
          id="story-section-1"
          ref={storySection1Ref}
          className="relative z-10 min-h-[95vh] sm:min-h-[85vh] flex items-start justify-center px-6 pt-8 sm:pt-10 pb-20 sm:pb-24 md:pt-14 md:pb-28"
        >
          <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24 md:space-y-32">
            {landingContent.story.section1.layers.map((layer, index) => (
              <div key={index} className="text-layer text-center" style={{ perspective: '1000px' }}>
                <h2
                  className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight ${
                    layer.highlighted ? 'prismatic-text' : ''
                  }`}
                >
                  {layer.title}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">{layer.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {blocks.includes('section2') && (
        <section
          ref={storySection3Ref}
          className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20 sm:py-24 md:py-28"
        >
          <div className="max-w-6xl mx-auto text-center" style={{ perspective: '1500px' }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-8 sm:mb-10 md:mb-12">
              {landingContent.story.section2.words.map((word, i) => (
                <span
                  key={i}
                  className="story-word inline-block mx-1 sm:mx-1.5 md:mx-2 lg:mx-3"
                  style={{
                    transformStyle: 'preserve-3d',
                    color: landingContent.story.section2.highlightedIndices.includes(i)
                      ? i === 0
                        ? 'oklch(0.75 0.15 195)'
                        : i === 5
                          ? 'oklch(0.82 0.18 330)'
                          : 'oklch(0.88 0.16 85)'
                      : 'inherit',
                  }}
                >
                  {word}
                </span>
              ))}
            </h2>
          </div>
        </section>
      )}
    </>
  );
}
