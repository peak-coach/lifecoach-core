/**
 * LLM Client Abstraction
 * 
 * Abstrakte Schnittstelle für verschiedene LLM-Provider.
 * Phase 4: OpenAI-Implementierung
 * Später: Anthropic, lokale Modelle (Ollama), etc.
 */

import OpenAI from 'openai';
import { config } from '../config/env.js';
import logger from './logger.js';

// ============================================
// Types
// ============================================

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMClient {
  generateText(prompt: string, options?: LLMOptions): Promise<LLMResponse>;
}

// ============================================
// OpenAI Implementation
// ============================================

class OpenAILLMClient implements LLMClient {
  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    if (!config.llm.openaiApiKey) {
      logger.warn('OpenAI API key not configured. LLM features will be disabled.');
    }

    this.client = new OpenAI({
      apiKey: config.llm.openaiApiKey || 'dummy-key',
    });
    this.defaultModel = config.llm.model;
  }

  async generateText(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    const {
      model = this.defaultModel,
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt,
    } = options;

    logger.debug({ model, promptLength: prompt.length }, 'Calling OpenAI API');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const content = response.choices[0]?.message?.content || '';
      
      logger.debug(
        { 
          model: response.model,
          tokens: response.usage?.total_tokens,
        },
        'OpenAI response received'
      );

      return {
        content,
        model: response.model,
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      logger.error({ error }, 'OpenAI API error');
      throw error;
    }
  }
}

// ============================================
// Mock Client (for development without API key)
// ============================================

class MockLLMClient implements LLMClient {
  async generateText(prompt: string, options: LLMOptions = {}): Promise<LLMResponse> {
    logger.debug('Using mock LLM client');
    
    // Simuliere eine Antwort basierend auf dem Prompt-Kontext
    const content = this.generateMockResponse(prompt);
    
    return {
      content,
      model: 'mock-model',
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(content.length / 4),
        totalTokens: Math.ceil((prompt.length + content.length) / 4),
      },
    };
  }

  private generateMockResponse(prompt: string): string {
    if (prompt.toLowerCase().includes('day plan') || prompt.toLowerCase().includes('schedule')) {
      return 'Focus on your highest priority tasks in the morning when your energy is highest. Take regular breaks to maintain productivity throughout the day.';
    }
    if (prompt.toLowerCase().includes('review') || prompt.toLowerCase().includes('reflect')) {
      return 'Today was productive. You made good progress on your key tasks. Consider what worked well and what you could improve tomorrow.';
    }
    return 'This is a mock response. Configure your LLM_PROVIDER and API keys for real responses.';
  }
}

// ============================================
// Factory
// ============================================

function createLLMClient(): LLMClient {
  const provider = config.llm.provider;

  switch (provider) {
    case 'openai':
      if (config.llm.openaiApiKey) {
        return new OpenAILLMClient();
      }
      logger.warn('OpenAI API key missing, using mock client');
      return new MockLLMClient();

    case 'anthropic':
      // TODO: Implement Anthropic client
      logger.warn('Anthropic not yet implemented, using mock client');
      return new MockLLMClient();

    case 'local':
      // TODO: Implement local model client (Ollama)
      logger.warn('Local models not yet implemented, using mock client');
      return new MockLLMClient();

    default:
      logger.warn(`Unknown LLM provider: ${provider}, using mock client`);
      return new MockLLMClient();
  }
}

// ============================================
// Export
// ============================================

export const llmClient = createLLMClient();
export default llmClient;

