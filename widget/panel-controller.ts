/**
 * Panel Controller
 * Manages panel state transitions between normal and web-agent modes
 */

export type PanelMode = 'normal' | 'web-agent';

export interface PanelState {
  mode: PanelMode;
  progress: number; // 0-100
  isTransitioning: boolean;
}

/**
 * Panel Controller
 * Simple 2-state controller for agent panel
 */
export class PanelController {
  private state: PanelState = {
    mode: 'normal',
    progress: 0,
    isTransitioning: false,
  };

  private panelElement: HTMLElement | null = null;
  private progressBarElement: HTMLElement | null = null;

  constructor() {
    this.findPanelElement();
  }

  /**
   * Find the panel element in the DOM
   */
  private findPanelElement() {
    // Try to find agent panel by class name
    this.panelElement = document.querySelector('.lens-os-agent-panel') as HTMLElement;

    if (!this.panelElement) {
      console.warn('[PanelController] Agent panel not found');
    }
  }

  /**
   * Enter web-agent mode (panel becomes transparent)
   */
  async enterWebAgentMode(): Promise<void> {
    if (this.state.mode === 'web-agent') {
      return; // Already in web-agent mode
    }

    console.log('[PanelController] Entering web-agent mode');

    this.state.isTransitioning = true;
    this.state.mode = 'web-agent';
    this.state.progress = 0;

    // Apply transparent styles
    if (this.panelElement) {
      this.panelElement.style.transition = 'backdrop-filter 0.3s ease, opacity 0.3s ease';
      this.panelElement.style.backdropFilter = 'blur(0px)';
      (this.panelElement.style as any).webkitBackdropFilter = 'blur(0px)';
      this.panelElement.style.opacity = '0.05';
    }

    // Show progress bar
    this.showProgressBar();

    // Wait for transition
    await this.sleep(300);
    this.state.isTransitioning = false;
  }

  /**
   * Exit web-agent mode (panel becomes normal)
   */
  async exitWebAgentMode(): Promise<void> {
    if (this.state.mode === 'normal') {
      return; // Already in normal mode
    }

    console.log('[PanelController] Exiting web-agent mode');

    this.state.isTransitioning = true;
    this.state.progress = 100;

    // Wait a bit to show completion
    await this.sleep(500);

    // Hide progress bar
    this.hideProgressBar();

    // Restore normal styles
    if (this.panelElement) {
      this.panelElement.style.transition = 'backdrop-filter 0.3s ease, opacity 0.3s ease';
      this.panelElement.style.backdropFilter = 'blur(6px)';
      (this.panelElement.style as any).webkitBackdropFilter = 'blur(6px)';
      this.panelElement.style.opacity = '1';
    }

    // Wait for transition
    await this.sleep(300);

    this.state.mode = 'normal';
    this.state.progress = 0;
    this.state.isTransitioning = false;
  }

  /**
   * Update progress (0-100)
   */
  updateProgress(progress: number): void {
    this.state.progress = Math.min(Math.max(progress, 0), 100);

    if (this.progressBarElement) {
      const fill = this.progressBarElement.querySelector('.progress-fill') as HTMLElement;
      if (fill) {
        fill.style.width = `${this.state.progress}%`;
      }

      const text = this.progressBarElement.querySelector('.progress-text') as HTMLElement;
      if (text) {
        text.textContent = `${Math.round(this.state.progress)}%`;
      }
    }
  }

  /**
   * Show progress bar
   */
  private showProgressBar(): void {
    // Create progress bar if it doesn't exist
    if (!this.progressBarElement) {
      this.progressBarElement = document.createElement('div');
      this.progressBarElement.className = 'lens-web-agent-progress';
      this.progressBarElement.innerHTML = `
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
      `;

      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .lens-web-agent-progress {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 999999;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 24px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .lens-web-agent-progress .progress-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lens-web-agent-progress .progress-bar {
          width: 200px;
          height: 8px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .lens-web-agent-progress .progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .lens-web-agent-progress .progress-text {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          min-width: 40px;
          text-align: right;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(this.progressBarElement);
    }

    this.progressBarElement.style.display = 'block';
  }

  /**
   * Hide progress bar
   */
  private hideProgressBar(): void {
    if (this.progressBarElement) {
      this.progressBarElement.style.display = 'none';
    }
  }

  /**
   * Get current state
   */
  getState(): PanelState {
    return { ...this.state };
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
