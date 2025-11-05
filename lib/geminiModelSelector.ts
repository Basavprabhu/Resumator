interface GeminiModel {
  name: string;
  rpm: number;    // Requests per minute
  tpm: number;    // Tokens per minute
  rpd: number;    // Requests per day
  priority: number; // Higher number = higher priority (more powerful model)
}

interface ModelUsage {
  requestsThisMinute: number;
  requestsToday: number;
  tokensThisMinute: number;
  lastResetMinute: number;
  lastResetDay: number;
}

interface ModelSelector {
  models: GeminiModel[];
  usage: Map<string, ModelUsage>;
  fallbackChain: string[];
}

// Gemini models in descending order of power/capability
const GEMINI_MODELS: GeminiModel[] = [
  {
    name: 'gemini-2.5-pro',
    rpm: 5,
    tpm: 250000,
    rpd: 100,
    priority: 5
  },
  {
    name: 'gemini-2.5-flash',
    rpm: 10,
    tpm: 250000,
    rpd: 250,
    priority: 4
  },
  {
    name: 'gemini-2.0-flash',
    rpm: 15,
    tpm: 1000000,
    rpd: 200,
    priority: 3
  },
  {
    name: 'gemini-2.5-flash-lite',
    rpm: 15,
    tpm: 250000,
    rpd: 1000,
    priority: 2
  },
  {
    name: 'gemini-2.0-flash-lite',
    rpm: 30,
    tpm: 1000000,
    rpd: 200,
    priority: 1
  }
];

class GeminiModelSelector {
  private models: Map<string, GeminiModel>;
  private usage: Map<string, ModelUsage>;
  private fallbackChain: string[];

  constructor() {
    this.models = new Map();
    this.usage = new Map();
    
    // Initialize models and usage tracking
    GEMINI_MODELS.forEach(model => {
      this.models.set(model.name, model);
      this.usage.set(model.name, {
        requestsThisMinute: 0,
        requestsToday: 0,
        tokensThisMinute: 0,
        lastResetMinute: this.getCurrentMinute(),
        lastResetDay: this.getCurrentDay()
      });
    });

    // Create fallback chain (highest priority first)
    this.fallbackChain = GEMINI_MODELS
      .sort((a, b) => b.priority - a.priority)
      .map(model => model.name);
  }

  private getCurrentMinute(): number {
    return Math.floor(Date.now() / (1000 * 60));
  }

  private getCurrentDay(): number {
    return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  }

  private resetCountersIfNeeded(modelName: string): void {
    const usage = this.usage.get(modelName);
    if (!usage) return;

    const currentMinute = this.getCurrentMinute();
    const currentDay = this.getCurrentDay();

    // Reset minute counters
    if (currentMinute > usage.lastResetMinute) {
      usage.requestsThisMinute = 0;
      usage.tokensThisMinute = 0;
      usage.lastResetMinute = currentMinute;
    }

    // Reset daily counters
    if (currentDay > usage.lastResetDay) {
      usage.requestsToday = 0;
      usage.lastResetDay = currentDay;
    }
  }

  private isModelAvailable(modelName: string, estimatedTokens: number = 1000): boolean {
    const model = this.models.get(modelName);
    const usage = this.usage.get(modelName);
    
    if (!model || !usage) return false;

    this.resetCountersIfNeeded(modelName);

    // Check all rate limits
    const withinRPM = usage.requestsThisMinute < model.rpm;
    const withinTPM = (usage.tokensThisMinute + estimatedTokens) <= model.tpm;
    const withinRPD = usage.requestsToday < model.rpd;

    return withinRPM && withinTPM && withinRPD;
  }

  /**
   * Select the best available model based on current usage and rate limits
   * @param estimatedTokens - Estimated tokens for the request (default: 1000)
   * @param preferHighPerformance - Prefer higher performance models even if others are available
   * @returns The selected model name or null if none available
   */
  public selectModel(estimatedTokens: number = 1000, preferHighPerformance: boolean = true): string | null {
    // Strategy 1: Try highest priority models first if preferHighPerformance is true
    if (preferHighPerformance) {
      for (const modelName of this.fallbackChain) {
        if (this.isModelAvailable(modelName, estimatedTokens)) {
          return modelName;
        }
      }
    } else {
      // Strategy 2: Use models more efficiently - try lower priority models first to save high-priority quota
      const reversedChain = [...this.fallbackChain].reverse();
      for (const modelName of reversedChain) {
        if (this.isModelAvailable(modelName, estimatedTokens)) {
          return modelName;
        }
      }
    }

    return null; // No models available
  }

  /**
   * Record usage after making a successful API call
   * @param modelName - The model that was used
   * @param actualTokens - Actual tokens consumed
   */
  public recordUsage(modelName: string, actualTokens: number): void {
    const usage = this.usage.get(modelName);
    if (!usage) return;

    this.resetCountersIfNeeded(modelName);
    
    usage.requestsThisMinute++;
    usage.requestsToday++;
    usage.tokensThisMinute += actualTokens;
  }

  /**
   * Get current usage statistics for all models
   */
  public getUsageStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.models.forEach((model, name) => {
      const usage = this.usage.get(name);
      this.resetCountersIfNeeded(name);
      
      if (usage) {
        stats[name] = {
          model: {
            rpm: model.rpm,
            tpm: model.tpm,
            rpd: model.rpd,
            priority: model.priority
          },
          current: {
            requestsThisMinute: usage.requestsThisMinute,
            requestsToday: usage.requestsToday,
            tokensThisMinute: usage.tokensThisMinute,
            available: this.isModelAvailable(name)
          },
          utilization: {
            rpmUsage: `${usage.requestsThisMinute}/${model.rpm}`,
            rpdUsage: `${usage.requestsToday}/${model.rpd}`,
            tpmUsage: `${usage.tokensThisMinute}/${model.tpm}`
          }
        };
      }
    });

    return stats;
  }

  /**
   * Get the next best alternative if the current model fails
   * @param currentModel - The model that failed
   * @param estimatedTokens - Estimated tokens for the request
   */
  public getNextBestModel(currentModel: string, estimatedTokens: number = 1000): string | null {
    const currentIndex = this.fallbackChain.indexOf(currentModel);
    
    // Try models after the current one in the fallback chain
    for (let i = currentIndex + 1; i < this.fallbackChain.length; i++) {
      const modelName = this.fallbackChain[i];
      if (this.isModelAvailable(modelName, estimatedTokens)) {
        return modelName;
      }
    }

    return null;
  }

  /**
   * Smart model selection for different use cases
   */
  public selectForUseCase(useCase: 'resume-generation' | 'simple-task' | 'complex-analysis', estimatedTokens?: number): string | null {
    const tokenEstimates = {
      'resume-generation': 2000,
      'simple-task': 500,
      'complex-analysis': 5000
    };

    const tokens = estimatedTokens || tokenEstimates[useCase];
    
    switch (useCase) {
      case 'resume-generation':
        // For resume generation, prefer quality but allow fallback
        return this.selectModel(tokens, true);
      
      case 'simple-task':
        // For simple tasks, prefer efficiency (use lower-tier models first)
        return this.selectModel(tokens, false);
      
      case 'complex-analysis':
        // For complex analysis, strongly prefer high-performance models
        const highPerfModels = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
        for (const modelName of highPerfModels) {
          if (this.isModelAvailable(modelName, tokens)) {
            return modelName;
          }
        }
        return null; // Don't fallback to lite models for complex tasks
      
      default:
        return this.selectModel(tokens, true);
    }
  }
}

// Singleton instance
const modelSelector = new GeminiModelSelector();

export { GeminiModelSelector, modelSelector };
export type { GeminiModel, ModelUsage }; 