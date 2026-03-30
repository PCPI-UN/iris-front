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
          ref={storySection1Ref}
          className="relative z-10 min-h-[85vh] flex items-start justify-center px-6 pt-10 pb-24 md:pt-14 md:pb-28"
        >
          <div className="max-w-5xl mx-auto space-y-32">
            {landingContent.story.section1.layers.map((layer, index) => (
              <div key={index} className="text-layer text-center" style={{ perspective: '1000px' }}>
                <h2
                  className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${
                    layer.highlighted ? 'prismatic-text' : ''
                  }`}
                >
                  {layer.title}
                </h2>
                <p className="text-2xl md:text-3xl text-muted-foreground">{layer.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {blocks.includes('section2') && (
        <section
          ref={storySection3Ref}
          className="relative z-10 min-h-screen flex items-center justify-center px-6 py-32"
        >
          <div className="max-w-6xl mx-auto text-center" style={{ perspective: '1500px' }}>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-12">
              {landingContent.story.section2.words.map((word, i) => (
                <span
                  key={i}
                  className="story-word inline-block mx-2 md:mx-3"
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
