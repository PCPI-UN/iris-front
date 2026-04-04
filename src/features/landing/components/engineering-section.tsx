'use client';

import { RefObject } from 'react';
import { Users } from 'lucide-react';
import type { EngineeringField } from '../types';
import { landingContent } from '../content';
import { GlassCard } from './glass-card';
import Link from 'next/link';

interface EngineeringSectionProps {
  engineeringSectionRef: RefObject<HTMLElement>;
  maskTextRef: RefObject<HTMLHeadingElement>;
  engineeringFields: EngineeringField[];
  activeEngineering: number;
}

export function EngineeringSection({
  engineeringSectionRef,
  maskTextRef,
  engineeringFields,
  activeEngineering,
}: EngineeringSectionProps) {
  return (
    <>
      {/* Mask Text Section - Jextures Style */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2
            ref={maskTextRef}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-none mb-12 pb-4"
            style={{ clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' }}
          >
            {landingContent.engineering.maskText.split(landingContent.engineering.maskTextHighlight)[0]}
            <span className="prismatic-text">{landingContent.engineering.maskTextHighlight}</span>
            {landingContent.engineering.maskText.split(landingContent.engineering.maskTextHighlight)[1]}
          </h2>
        </div>
      </section>

      {/* Engineering Fields Grid */}
      <section
        id="ingenierias"
        ref={engineeringSectionRef}
        className="relative z-10 px-6 py-10 md:px-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary mb-6">
              <Users className="w-4 h-4" />
              <span>{landingContent.engineering.badge}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              {landingContent.engineering.title} <span className="prismatic-text">{landingContent.engineering.titleHighlight}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {engineeringFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <Link
                  key={field.id}
                  href={field.url}
                  className="block" 
                >
                  <GlassCard
                    key={field.id}
                    className={`engineering-card group cursor-pointer hover:scale-105 transition-all duration-500 ${
                      activeEngineering === index ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${field.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`}
                    />
                    <div className="relative z-10">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                        style={{
                          background: `color-mix(in oklch, ${field.color}, transparent 80%)`,
                          boxShadow: `0 0 30px color-mix(in oklch, ${field.color}, transparent 50%)`,
                        }}
                      >
                        <Icon className="w-7 h-7" style={{ color: field.color }} />
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {field.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {field.description}
                      </p>
                    </div>
                  </GlassCard>
                </Link>
                );
              })}
          </div>
        </div>
      </section>
    </>
  );
}
