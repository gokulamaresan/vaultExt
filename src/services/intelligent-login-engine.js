/**
 * Advanced Intelligent Login Detection Engine
 * Fully autonomous DOM analysis, dynamic SPA detection, field scoring, and React-safe credential injection.
 */

class IntelligentLoginEngine {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 10,
      retryIntervalMs: options.retryIntervalMs || 500,
      debounceMs: options.debounceMs || 300,
      ...options
    };
    
    this.hasAutoFilled = false;
    this.observer = null;
    this.debounceTimer = null;
    this.retryCount = 0;

    // Robust priority configurations for matching input nodes
    this.patterns = {
      username: [
        { regex: /user|login|id|name/i, weight: 10 },
        { regex: /email/i, weight: 8 },
        { attribute: 'type', value: 'email', weight: 10 },
        { attribute: 'type', value: 'text', weight: 3 },
        { attribute: 'autocomplete', value: 'username', weight: 15 }
      ],
      password: [
        { attribute: 'type', value: 'password', weight: 20 },
        { regex: /pass|pwd/i, weight: 12 },
        { attribute: 'autocomplete', value: 'current-password', weight: 15 }
      ],
      otp: [
        { regex: /otp|code|token|verify|2fa|mfa/i, weight: 15 }
      ]
    };
  }

  /**
   * Primary entry point: Starts monitoring the living DOM lifecycle
   */
  initialize(credentials) {
    if (!credentials || !credentials.username || !credentials.password) {
      console.warn('[Engine] Invalid credential bundle provided.');
      return;
    }
    
    this.credentials = credentials;
    
    if (document.readyState === 'complete') {
      this.executeDetectionLoop();
    } else {
      window.addEventListener('load', () => this.executeDetectionLoop());
    }

    this.mountMutationObserver();
  }

  /**
   * Mount DOM MutationObserver to catch Single Page App dynamic form rendering
   */
  mountMutationObserver() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      if (this.hasAutoFilled) return;

      const hasSignificantAdditions = mutations.some(m => 
        m.addedNodes.length > 0 && 
        Array.from(m.addedNodes).some(n => n.nodeType === 1 && (n.tagName === 'FORM' || n.tagName === 'INPUT' || n.querySelector?.('input')))
      );

      if (hasSignificantAdditions) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          console.log('[Engine] Significant dynamic DOM modifications detected. Re-evaluating...');
          this.executeDetectionLoop();
        }, this.options.debounceMs);
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Evaluates current document layout for valid credential target boundaries
   */
  executeDetectionLoop() {
    if (this.hasAutoFilled) return;

    console.log(`[Engine] Running detection loop (Attempt ${this.retryCount + 1})...`);
    
    const isOTPStep = this.detectOTPScreen();
    if (isOTPStep) {
      console.log('[Engine] Active OTP / Multi-factor verification state identified. Halting password autofills.');
      return;
    }

    const targetForm = this.findOptimalFormContainer();
    
    if (targetForm && targetForm.usernameNode && targetForm.passwordNode) {
      console.log('[Engine] Optimal credentials boundary resolved successfully:', targetForm);
      this.performSafeInjection(targetForm);
    } else if (this.retryCount < this.options.maxRetries) {
      this.retryCount++;
      setTimeout(() => this.executeDetectionLoop(), this.options.retryIntervalMs);
    } else {
      console.warn('[Engine] Exceeded maximum auto-detection verification cycles.');
    }
  }

  /**
   * Identifies multi-step / OTP active authentication views safely
   */
  detectOTPScreen() {
    const visibleInputs = Array.from(document.querySelectorAll('input')).filter(n => this.isNodeVisible(n));
    return visibleInputs.some(input => {
      const combinedMeta = `${input.id} ${input.name} ${input.className} ${input.placeholder}`.toLowerCase();
      return this.patterns.otp.some(p => p.regex?.test(combinedMeta));
    });
  }

  /**
   * Scans native forms and generic interactive layout structures to locate nearest input grouping container
   */
  findOptimalFormContainer() {
    const candidateContainers = Array.from(document.querySelectorAll('form, div, section')).filter(el => {
      if (!this.isNodeVisible(el)) return false;
      // Valid candidate blocks must contain inner input bounds
      return el.tagName === 'FORM' || el.querySelectorAll('input').length > 0;
    });

    let highestScore = -1;
    let optimalBundle = null;

    for (const container of candidateContainers) {
      const inputs = Array.from(container.querySelectorAll('input')).filter(n => this.isNodeVisible(n));
      if (inputs.length < 1) continue;

      let bestUserNode = null;
      let highestUserScore = 0;
      let bestPassNode = null;
      let highestPassScore = 0;

      for (const input of inputs) {
        const uScore = this.calculateFieldScore(input, 'username');
        if (uScore > highestUserScore) {
          highestUserScore = uScore;
          bestUserNode = input;
        }

        const pScore = this.calculateFieldScore(input, 'password');
        if (pScore > highestPassScore) {
          highestPassScore = pScore;
          bestPassNode = input;
        }
      }

      // Priority matching rules scoring combination
      if (bestUserNode && bestPassNode) {
        const totalScore = highestUserScore + highestPassScore + (container.tagName === 'FORM' ? 10 : 0);
        if (totalScore > highestScore) {
          highestScore = totalScore;
          optimalBundle = {
            container,
            usernameNode: bestUserNode,
            passwordNode: bestPassNode,
            submitButton: this.findSubmitTrigger(container)
          };
        }
      }
    }

    // Secondary heuristic fallback: Look up global document level layout bounds if isolated fields present
    if (!optimalBundle) {
      const allInputs = Array.from(document.querySelectorAll('input')).filter(n => this.isNodeVisible(n));
      let gUser = null, gPass = null;
      let maxU = 0, maxP = 0;
      
      allInputs.forEach(inpt => {
        const uS = this.calculateFieldScore(inpt, 'username');
        if (uS > maxU) { maxU = uS; gUser = inpt; }
        const pS = this.calculateFieldScore(inpt, 'password');
        if (pS > maxP) { maxP = pS; gPass = inpt; }
      });

      if (gUser && gPass) {
        optimalBundle = {
          container: document.body,
          usernameNode: gUser,
          passwordNode: gPass,
          submitButton: this.findSubmitTrigger(document.body)
        };
      }
    }

    return optimalBundle;
  }

  /**
   * Intelligently scores any input node against expected heuristic attributes
   */
  calculateFieldScore(node, fieldType) {
    let score = 0;
    const rules = this.patterns[fieldType];
    const combinedString = `${node.id} ${node.name} ${node.placeholder} ${node.className}`.toLowerCase();

    // Type validation filters
    if (fieldType === 'username' && node.type === 'password') return 0;
    if (fieldType === 'password' && node.type !== 'password') {
      // Extremely specific custom rules exceptions: Some legacy sites reveal passwords via type="text"
      if (!/pass/i.test(combinedString)) return 0;
    }

    rules.forEach(rule => {
      if (rule.regex && rule.regex.test(combinedString)) {
        score += rule.weight;
      }
      if (rule.attribute && node.getAttribute(rule.attribute)?.toLowerCase() === rule.value) {
        score += rule.weight;
      }
    });

    // Check distance / depth proximity rewards
    if (!node.disabled && !node.readOnly) {
      score += 2;
    }

    return score;
  }

  /**
   * Locates submission triggering element inside matched layout parameters
   */
  findSubmitTrigger(container) {
    const buttons = Array.from(container.querySelectorAll('button, input[type="submit"], input[type="button"]')).filter(b => this.isNodeVisible(b));
    
    // Sort logic via target context matching heuristics
    for (const btn of buttons) {
      const meta = `${btn.type} ${btn.id} ${btn.className} ${btn.textContent} ${btn.value}`.toLowerCase();
      if (/submit|login|signin|sign in|log in|continue|next/i.test(meta)) {
        return btn;
      }
    }
    
    // Default fallback to first available standard interactive clickable block
    return buttons[0] || null;
  }

  /**
   * Verifies actual interface style constraints mapping real physical screen presence
   */
  isNodeVisible(node) {
    if (!node || node.nodeType !== 1) return false;
    // Fast native checks
    if (node.type === 'hidden' || node.style?.display === 'none' || node.style?.visibility === 'hidden') return false;
    
    // Strict client bounding calculations
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // Check parent inheritance chain visibility logic
    const computedStyle = window.getComputedStyle(node);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
      return false;
    }

    return true;
  }

  /**
   * Implements React/Vue framework bypass hooks directly onto input structures safely
   */
  performSafeInjection(targetBundle) {
    try {
      this.hasAutoFilled = true;
      if (this.observer) {
        this.observer.disconnect(); // Disable continuous loop listener once consumed
      }

      const { usernameNode, passwordNode, submitButton } = targetBundle;

      // React / Vue Virtual DOM Prototype bypass execution strategy
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      const triggerReactivity = (node, stringVal) => {
        if (nativeSetter) {
          nativeSetter.call(node, stringVal);
        } else {
          node.value = stringVal;
        }
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
      };

      // Populate targeted identity nodes
      triggerReactivity(usernameNode, this.credentials.username);
      triggerReactivity(passwordNode, this.credentials.password);

      console.log('[Engine] Dispatched native interface state strings successfully.');

      // Trigger Submission Automation chain
      setTimeout(() => {
        if (submitButton && !submitButton.disabled) {
          console.log('[Engine] Executing submission triggers click sequence on:', submitButton);
          submitButton.click();
        } else if (targetBundle.container && targetBundle.container.tagName === 'FORM') {
          console.log('[Engine] Dispatching native standard base HTML form submit event.');
          targetBundle.container.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }, 400);

    } catch (err) {
      console.error('[Engine] Core runtime injection error encountered:', err);
      this.hasAutoFilled = false; // Re-arm engine status flag state evaluation on failure exceptions
    }
  }
}

export default IntelligentLoginEngine;
