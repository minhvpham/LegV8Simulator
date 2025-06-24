import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface WirePathHighlighterProps {
  highlightedPaths: string[];
  duration?: number;
  onHighlightComplete?: () => void;
}

const WirePathHighlighter: React.FC<WirePathHighlighterProps> = ({
  highlightedPaths,
  duration = 1000,
  onHighlightComplete
}) => {
  const animationRefs = useRef<Map<string, gsap.core.Timeline>>(new Map());

  useEffect(() => {
    // Clear previous animations
    animationRefs.current.forEach((tl) => tl.kill());
    animationRefs.current.clear();

    if (highlightedPaths.length === 0) {
      return;
    }

    let completedCount = 0;
    const totalPaths = highlightedPaths.length;    highlightedPaths.forEach((pathId) => {
      console.log(`Trying to highlight wire path: ${pathId}`);
      
      // Find all wire segments for this path
      const wireElements = document.querySelectorAll(`[data-wire-path="${pathId}"], [data-wire="${pathId}"]`);
      console.log(`Found ${wireElements.length} elements for path ${pathId} using exact selectors`);
      
      if (wireElements.length === 0) {
        // Try to find by partial match or common wire naming patterns
        const possibleSelectors = [
          `[data-wire*="${pathId}"]`,
          `[stroke][d*="${pathId}"]`, // SVG paths
          `.wire-${pathId}`,
          `#${pathId}`,
          // Try component-based selectors
          `[data-wire-from*="${pathId.split('_TO_')[0]}"][data-wire-to*="${pathId.split('_TO_')[1]}"]`
        ];

        let found = false;
        for (const selector of possibleSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              console.log(`Found wire elements for ${pathId} using selector: ${selector}`);
              highlightWireElements(elements, pathId);
              found = true;
              break;
            }
          } catch (e) {
            // Invalid selector, continue
          }
        }

        if (!found) {
          console.warn(`No wire elements found for path: ${pathId}`);
          completedCount++;
          if (completedCount === totalPaths && onHighlightComplete) {
            onHighlightComplete();
          }
        }
      } else {
        highlightWireElements(wireElements, pathId);
      }
    });

    function highlightWireElements(elements: NodeListOf<Element>, pathId: string) {
      const tl = gsap.timeline({
        onComplete: () => {
          completedCount++;
          if (completedCount === totalPaths && onHighlightComplete) {
            onHighlightComplete();
          }
          animationRefs.current.delete(pathId);
        }
      });

      elements.forEach((element) => {
        const originalStroke = element.getAttribute('stroke') || '#000000';
        const originalStrokeWidth = element.getAttribute('stroke-width') || '1';
        
        // Store original values for restoration
        element.setAttribute('data-original-stroke', originalStroke);
        element.setAttribute('data-original-stroke-width', originalStrokeWidth);

        // Highlight animation
        tl.to(element, {
          duration: 0.2,
          attr: { 
            stroke: '#FCD34D', // Yellow color
            'stroke-width': parseFloat(originalStrokeWidth) * 2,
            'stroke-dasharray': '0' // Remove any dashing
          },
          ease: "power2.out"
        }, 0); // Start immediately

        // Hold the highlight
        tl.to(element, {
          duration: (duration - 400) / 1000, // Convert to seconds and account for fade in/out
          attr: { 
            stroke: '#FCD34D',
            'stroke-width': parseFloat(originalStrokeWidth) * 2
          }
        });

        // Fade out
        tl.to(element, {
          duration: 0.2,
          attr: { 
            stroke: originalStroke,
            'stroke-width': originalStrokeWidth
          },
          ease: "power2.in"
        });
      });

      animationRefs.current.set(pathId, tl);
    }

    return () => {
      animationRefs.current.forEach((tl) => tl.kill());
    };
  }, [highlightedPaths, duration, onHighlightComplete]);

  // This component doesn't render anything visible - it just manipulates existing SVG elements
  return null;
};

export default WirePathHighlighter;
