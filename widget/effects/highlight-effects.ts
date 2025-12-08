/**
 * Highlight Effects
 * Various visual effects for highlighting elements
 */

export type HighlightStyle = 'highlighter' | 'glow' | 'circle';

/**
 * Highlight effect manager
 */
export class HighlightEffects {
  private activeEffects: Map<HTMLElement, () => void> = new Map();

  /**
   * Apply highlight effect to element
   */
  async highlight(
    element: HTMLElement,
    style: HighlightStyle = 'glow',
    duration: number = 2000
  ): Promise<void> {
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.sleep(300);

    // Remove existing effect if any
    this.removeEffect(element);

    // Apply effect based on style
    let cleanup: (() => void) | null = null;

    switch (style) {
      case 'highlighter':
        cleanup = this.applyHighlighterEffect(element, duration);
        break;
      case 'glow':
        cleanup = this.applyGlowEffect(element);
        break;
      case 'circle':
        cleanup = this.applyCircleEffect(element, duration);
        break;
    }

    // Store cleanup function
    if (cleanup) {
      this.activeEffects.set(element, cleanup);

      // Auto-remove after duration
      setTimeout(() => {
        this.removeEffect(element);
      }, duration);
    }
  }

  /**
   * Highlighter effect (for text elements)
   * Yellow gradient sweep like a physical highlighter
   */
  private applyHighlighterEffect(element: HTMLElement, duration: number): () => void {
    const originalPosition = element.style.position;
    const originalZIndex = element.style.zIndex;

    // Ensure element can have pseudo-elements
    if (!element.style.position || element.style.position === 'static') {
      element.style.position = 'relative';
    }
    element.style.zIndex = '10000';

    // Create highlighter overlay
    const highlighter = document.createElement('div');
    highlighter.className = 'lens-highlighter-effect';
    highlighter.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 235, 59, 0.6) 50%, transparent 100%);
      pointer-events: none;
      z-index: 10001;
      animation: highlighterSweep ${duration}ms ease-in-out;
    `;

    // Add keyframes if not exists
    if (!document.querySelector('#lens-highlighter-keyframes')) {
      const style = document.createElement('style');
      style.id = 'lens-highlighter-keyframes';
      style.textContent = `
        @keyframes highlighterSweep {
          0% {
            left: -100%;
          }
          50% {
            left: 0%;
          }
          100% {
            left: 100%;
          }
        }
      `;
      document.head.appendChild(style);
    }

    element.appendChild(highlighter);

    return () => {
      highlighter.remove();
      element.style.position = originalPosition;
      element.style.zIndex = originalZIndex;
    };
  }

  /**
   * Glow effect (for containers/divs)
   * Pulsing border with box-shadow
   */
  private applyGlowEffect(element: HTMLElement): () => void {
    const originalOutline = element.style.outline;
    const originalBoxShadow = element.style.boxShadow;
    const originalTransition = element.style.transition;

    element.style.transition = 'all 0.3s ease';
    element.style.outline = '3px solid rgba(102, 126, 234, 0.8)';
    element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.4)';

    // Add pulsing animation
    const pulseKeyframes = `
      @keyframes lensGlowPulse {
        0%, 100% {
          outline-color: rgba(102, 126, 234, 0.8);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(102, 126, 234, 0.4);
        }
        50% {
          outline-color: rgba(118, 75, 162, 0.8);
          box-shadow: 0 0 30px rgba(118, 75, 162, 0.6), 0 0 60px rgba(118, 75, 162, 0.4);
        }
      }
    `;

    if (!document.querySelector('#lens-glow-keyframes')) {
      const style = document.createElement('style');
      style.id = 'lens-glow-keyframes';
      style.textContent = pulseKeyframes;
      document.head.appendChild(style);
    }

    element.style.animation = `lensGlowPulse 1s ease-in-out infinite`;

    return () => {
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
      element.style.transition = originalTransition;
      element.style.animation = '';
    };
  }

  /**
   * Circle effect (for buttons/small elements)
   * Red circle drawn with SVG animation
   */
  private applyCircleEffect(element: HTMLElement, duration: number): () => void {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.max(rect.width, rect.height) / 2 + 20;

    // Create SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999999;
    `;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', centerX.toString());
    circle.setAttribute('cy', centerY.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#ff0000');
    circle.setAttribute('stroke-width', '4');
    circle.setAttribute('stroke-linecap', 'round');

    const circumference = 2 * Math.PI * radius;
    circle.setAttribute('stroke-dasharray', circumference.toString());
    circle.setAttribute('stroke-dashoffset', circumference.toString());

    circle.style.cssText = `
      animation: lensCircleDraw ${duration * 0.4}ms ease-out forwards;
    `;

    // Add keyframes
    if (!document.querySelector('#lens-circle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'lens-circle-keyframes';
      style.textContent = `
        @keyframes lensCircleDraw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    svg.appendChild(circle);
    document.body.appendChild(svg);

    return () => {
      svg.remove();
    };
  }

  /**
   * Remove effect from element
   */
  private removeEffect(element: HTMLElement): void {
    const cleanup = this.activeEffects.get(element);
    if (cleanup) {
      cleanup();
      this.activeEffects.delete(element);
    }
  }

  /**
   * Remove all effects
   */
  removeAllEffects(): void {
    this.activeEffects.forEach((cleanup) => cleanup());
    this.activeEffects.clear();
  }

  /**
   * Auto-detect best highlight style for element
   */
  detectBestStyle(element: HTMLElement): HighlightStyle {
    const tagName = element.tagName.toLowerCase();
    const rect = element.getBoundingClientRect();
    const isSmall = rect.width < 100 && rect.height < 50;

    // Small buttons/links -> circle
    if (isSmall && (tagName === 'button' || tagName === 'a' || element.getAttribute('role') === 'button')) {
      return 'circle';
    }

    // Text elements (spans, paragraphs, headings) -> highlighter
    if (['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td'].includes(tagName)) {
      return 'highlighter';
    }

    // Default: glow for containers
    return 'glow';
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
