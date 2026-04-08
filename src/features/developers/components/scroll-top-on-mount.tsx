'use client';
// Make sure to scroll to top of the page when needed
import { useEffect } from 'react';

export function ScrollTopOnMount() {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;

    html.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, behavior: 'auto' });

    requestAnimationFrame(() => {
      html.style.scrollBehavior = previous;
    });
  }, []);

  return null;
}
