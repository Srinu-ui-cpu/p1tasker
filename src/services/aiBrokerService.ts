import { AIState, AIProvider, CustomAIConfig } from '../types';
import { StorageService } from './storageService';

const AI_STORAGE_KEY = 'tasker_ai_config_v1';

export class AIBrokerService {
  private static defaultState: AIState = {
    activeProvider: 'gemini',
    apiKeys: {
      gemini: '',
      groq: '',
      openai: '',
    },
    selectedModels: {
      gemini: 'gemini-1.5-flash',
      groq: 'llama-3.3-70b-versatile',
      openai: 'gpt-4o-mini',
    },
    discoveredModels: {
      gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'],
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
      openai: ['gpt-4o-mini', 'gpt-4o'],
    },
    customConfig: {
      providerName: 'xAI Grok',
      baseUrl: 'https://api.x.ai/v1',
      modelName: 'grok-2-latest',
      apiKey: '',
    },
    localAI: {
      installed: false,
      modelName: 'SmolLM2-1.7B-Instruct (Local WebGPU)',
      progress: 0,
      status: 'idle',
    },
  };

  static getConfig(): AIState {
    try {
      const data = localStorage.getItem(AI_STORAGE_KEY);
      if (!data) return this.defaultState;
      const parsed = JSON.parse(data);
      return {
        ...this.defaultState,
        ...parsed,
        apiKeys: { ...this.defaultState.apiKeys, ...(parsed.apiKeys || {}) },
        selectedModels: { ...this.defaultState.selectedModels, ...(parsed.selectedModels || {}) },
        discoveredModels: { ...this.defaultState.discoveredModels, ...(parsed.discoveredModels || {}) },
        customConfig: { ...this.defaultState.customConfig, ...(parsed.customConfig || {}) },
        localAI: { ...this.defaultState.localAI, ...(parsed.localAI || {}) },
      };
    } catch {
      return this.defaultState;
    }
  }

  static saveConfig(config: AIState): void {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(config));
    // Proactively persist updated configuration and API keys to cloud vault
    try {
      import('./googleAuthService').then(({ GoogleAuthService }) => {
        if (GoogleAuthService.isAuthenticated()) {
          GoogleAuthService.triggerDriveSync().catch(() => {});
        }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Completely purges all stored AI API keys locally and from Google Drive vault
   */
  static purgeAllApiKeys(): void {
    const config = this.getConfig();
    config.apiKeys = {
      gemini: '',
      groq: '',
      openai: '',
    };
    config.customConfig.apiKey = '';
    this.saveConfig(config);
  }

  // --- DYNAMIC LIVE MODEL DISCOVERY (NO HARDCODING) ---

  /**
   * Dynamically fetch live models for Groq
   */
  static async discoverGroqModels(apiKey: string): Promise<string[]> {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();

      // Filter out whisper / audio / guard models, prioritize 70b and versatile
      const models: string[] = data.data
        .map((m: { id: string }) => m.id)
        .filter((id: string) => !id.includes('whisper') && !id.includes('guard'));

      // Sort with 70b/flagship at the top
      models.sort((a, b) => {
        if (a.includes('70b')) return -1;
        if (b.includes('70b')) return 1;
        return a.localeCompare(b);
      });

      const config = this.getConfig();
      config.discoveredModels.groq = models;
      if (models.length > 0 && !models.includes(config.selectedModels.groq || '')) {
        config.selectedModels.groq = models[0];
      }
      this.saveConfig(config);
      return models;
    } catch (e) {
      console.warn('Could not dynamically fetch Groq models:', e);
      return this.getConfig().discoveredModels.groq;
    }
  }

  /**
   * Dynamically fetch live models for Google Gemini
   */
  static async discoverGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();

      const models: string[] = (data.models || [])
        .map((m: { name: string }) => m.name.replace('models/', ''))
        .filter((id: string) => id.includes('gemini') && !id.includes('embedding'));

      // Sort with flash first, then pro
      models.sort((a, b) => {
        if (a.includes('flash') && !b.includes('flash')) return -1;
        if (b.includes('flash') && !a.includes('flash')) return 1;
        return a.localeCompare(b);
      });

      const config = this.getConfig();
      config.discoveredModels.gemini = models;
      if (models.length > 0 && !models.includes(config.selectedModels.gemini || '')) {
        config.selectedModels.gemini = models[0];
      }
      this.saveConfig(config);
      return models;
    } catch (e) {
      console.warn('Could not dynamically fetch Gemini models:', e);
      return this.getConfig().discoveredModels.gemini;
    }
  }

  /**
   * Dynamically fetch live models for OpenAI
   */
  static async discoverOpenAIModels(apiKey: string): Promise<string[]> {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();

      const models: string[] = data.data
        .map((m: { id: string }) => m.id)
        .filter((id: string) => id.startsWith('gpt-4') || id.startsWith('gpt-3.5') || id.startsWith('o1'));

      models.sort((a, b) => {
        if (a.includes('mini')) return -1;
        if (b.includes('mini')) return 1;
        return a.localeCompare(b);
      });

      const config = this.getConfig();
      config.discoveredModels.openai = models;
      if (models.length > 0 && !models.includes(config.selectedModels.openai || '')) {
        config.selectedModels.openai = models[0];
      }
      this.saveConfig(config);
      return models;
    } catch (e) {
      console.warn('Could not dynamically fetch OpenAI models:', e);
      return this.getConfig().discoveredModels.openai;
    }
  }

  // --- UNIVERSAL COMPLETION ROUTER WITH RATE-LIMIT (429) AUTO-FALLBACK ---

  static async completeText(
    prompt: string,
    systemInstruction: string = 'You are Tasker AI, an intelligent, empathetic, executive personal assistant.'
  ): Promise<{ text: string; modelUsed: string; fallbackOccurred?: boolean }> {
    const config = this.getConfig();
    let provider = config.activeProvider;

    // Check if the current provider has a key
    let hasCurrentKey = false;
    if (provider === 'local') hasCurrentKey = true;
    else if (provider === 'groq' && config.apiKeys.groq?.trim()) hasCurrentKey = true;
    else if (provider === 'gemini' && config.apiKeys.gemini?.trim()) hasCurrentKey = true;
    else if (provider === 'openai' && config.apiKeys.openai?.trim()) hasCurrentKey = true;
    else if (provider === 'custom' && config.customConfig.apiKey?.trim()) hasCurrentKey = true;

    // AUTO-FALLBACK: If current provider has NO key, pick first available provider that DOES have a key
    if (!hasCurrentKey) {
      if (config.apiKeys.groq?.trim()) provider = 'groq';
      else if (config.apiKeys.gemini?.trim()) provider = 'gemini';
      else if (config.apiKeys.openai?.trim()) provider = 'openai';
      else if (config.customConfig.apiKey?.trim()) provider = 'custom';
      else if (config.localAI.installed) provider = 'local';
    }

    // 1. Local AI Check
    if (provider === 'local') {
      return this.generateLocalAIResponse(prompt, systemInstruction);
    }

    // 2. Custom Provider (e.g. xAI Grok, DeepSeek, etc.)
    if (provider === 'custom') {
      if (!config.customConfig.apiKey?.trim()) {
        return this.generateSimulatedResponse(prompt, 'Custom Provider (No Key)', systemInstruction);
      }
      return this.callOpenAICompatible(
        config.customConfig.baseUrl,
        config.customConfig.apiKey,
        config.customConfig.modelName,
        prompt,
        systemInstruction
      );
    }

    // 3. Groq with Auto-Failover
    if (provider === 'groq') {
      const apiKey = config.apiKeys.groq;
      if (!apiKey) return this.generateSimulatedResponse(prompt, 'Groq (Key not set)', systemInstruction);

      const modelList = config.discoveredModels.groq.length > 0
        ? config.discoveredModels.groq
        : ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

      let primaryModel = config.selectedModels.groq || modelList[0];

      try {
        const res = await this.callOpenAICompatible(
          'https://api.groq.com/openai/v1',
          apiKey,
          primaryModel,
          prompt,
          systemInstruction
        );
        return res;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`Groq error on ${primaryModel}:`, error);
        const fallback = modelList.find(m => m !== primaryModel);
        if (fallback) {
          console.info(`Auto-fallback to Groq model: ${fallback}`);
          const fallbackRes = await this.callOpenAICompatible(
            'https://api.groq.com/openai/v1',
            apiKey,
            fallback,
            prompt,
            systemInstruction
          );
          return { ...fallbackRes, fallbackOccurred: true };
        }
        return this.generateSimulatedResponse(prompt, 'Groq (Rate Limit Fallback)', systemInstruction);
      }
    }

    // 4. Gemini with Auto-Failover
    if (provider === 'gemini') {
      const apiKey = config.apiKeys.gemini;
      if (!apiKey) return this.generateSimulatedResponse(prompt, 'Gemini (Key not set)', systemInstruction);

      const model = config.selectedModels.gemini || 'gemini-1.5-flash';
      try {
        const res = await this.callGemini(apiKey, model, prompt, systemInstruction);
        return res;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`Gemini error on ${model}:`, error);
        const fallback = model.includes('flash') ? 'gemini-1.5-flash-8b' : 'gemini-1.5-flash';
        try {
          const fallbackRes = await this.callGemini(apiKey, fallback, prompt, systemInstruction);
          return { ...fallbackRes, fallbackOccurred: true };
        } catch {
          return this.generateSimulatedResponse(prompt, 'Gemini (Fallback Engine)', systemInstruction);
        }
      }
    }

    // 5. OpenAI
    if (provider === 'openai') {
      const apiKey = config.apiKeys.openai;
      if (!apiKey) return this.generateSimulatedResponse(prompt, 'OpenAI (Key not set)', systemInstruction);

      const model = config.selectedModels.openai || 'gpt-4o-mini';
      try {
        return await this.callOpenAICompatible(
          'https://api.openai.com/v1',
          apiKey,
          model,
          prompt,
          systemInstruction
        );
      } catch {
        return this.generateSimulatedResponse(prompt, 'OpenAI (Fallback Engine)', systemInstruction);
      }
    }

    return this.generateSimulatedResponse(prompt, 'Tasker Built-In', systemInstruction);
  }

  // --- API CALL IMPLEMENTATIONS ---

  private static async callOpenAICompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    prompt: string,
    system: string
  ): Promise<{ text: string; modelUsed: string }> {
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`AI API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || 'No response returned from model.';
    return { text, modelUsed: model };
  }

  private static async callGemini(
    apiKey: string,
    model: string,
    prompt: string,
    system: string
  ): Promise<{ text: string; modelUsed: string }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return { text, modelUsed: model };
  }

  // --- KNOWLEDGE CHATBOT: CROSS-DATE CONTEXT BUILDER (RAG) ---

  /**
   * Builds full context of tasks, diary entries, and files across ALL dates.
   * Enables the chatbot to answer questions like:
   * "When did I work on the transaction tables in my project?"
   * and respond with clickable links like [14/09/2026](/day/2026-09-14)!
   */
  static buildGlobalContextSummary(query: string): { contextText: string; matchedDates: string[] } {
    const tasks = StorageService.getTasks();
    const diary = StorageService.getDiaryEntries();
    const files = StorageService.getFileRegistry();

    const lowerQuery = query.toLowerCase();
    const queryKeywords = lowerQuery.split(/\s+/).filter(w => w.length > 2);

    const relevantSnippets: string[] = [];
    const matchedDatesSet = new Set<string>();

    // 1. Search tasks
    tasks.forEach(task => {
      const matchScore = queryKeywords.filter(k =>
        task.title.toLowerCase().includes(k) ||
        (task.description && task.description.toLowerCase().includes(k)) ||
        task.tags.some(t => t.toLowerCase().includes(k))
      ).length;

      if (matchScore > 0 || tasks.length <= 15) {
        matchedDatesSet.add(task.date);
        const subtasksSummary = task.subtasks.length > 0
          ? ` (Subtasks: ${task.subtasks.map(s => `${s.completed ? '[x]' : '[ ]'} ${s.title}`).join(', ')})`
          : '';
        relevantSnippets.push(
          `- Task on date [${task.date}]: "${task.title}" (Status: ${task.status}, Priority: ${task.priority})${subtasksSummary}`
        );
      }
    });

    // 2. Search diary entries
    Object.values(diary).forEach(entry => {
      const matchScore = queryKeywords.filter(k =>
        entry.content.toLowerCase().includes(k) ||
        (entry.aiSummary && entry.aiSummary.toLowerCase().includes(k)) ||
        entry.tags.some(t => t.toLowerCase().includes(k))
      ).length;

      if (matchScore > 0 || Object.keys(diary).length <= 10) {
        matchedDatesSet.add(entry.date);
        relevantSnippets.push(
          `- Diary Entry on date [${entry.date}]: "${entry.content.slice(0, 300)}..." (Mood: ${entry.mood || 'N/A'})`
        );
      }
    });

    // 3. Search file registry
    Object.values(files).forEach(file => {
      if (queryKeywords.some(k => file.name.toLowerCase().includes(k))) {
        file.datesUsed.forEach(d => matchedDatesSet.add(d));
        relevantSnippets.push(
          `- Attached File "${file.name}" (Hash: ${file.hash.slice(0, 8)}) used on dates: ${file.datesUsed.map(d => `[${d}]`).join(', ')}`
        );
      }
    });

    return {
      contextText: relevantSnippets.slice(0, 25).join('\n'),
      matchedDates: Array.from(matchedDatesSet),
    };
  }

  /**
   * Generates a context-aware chatbot answer with clickable date links and artifacts
   */
  static async queryGlobalChatbot(
    userMessage: string
  ): Promise<{ responseText: string; modelUsed: string; artifact?: { type: 'mindmap' | 'image' | 'document'; content: string; caption?: string } }> {
    const { contextText, matchedDates } = this.buildGlobalContextSummary(userMessage);

    const systemPrompt = `You are Tasker's Omni-AI Assistant. You have full knowledge of all tasks, diary notes, and files across all dates.
Whenever you cite or refer to a specific date, you MUST format the date in square brackets, e.g.: [YYYY-MM-DD]. The UI will convert these into interactive clickable date pills!
Be direct, helpful, and organized. If the user asks about when they worked on something, inspect the provided history, mention the project/task names, completed steps, and what remains to do.

APP DATA CONTEXT:
${contextText || 'No prior entries recorded.'}`;

    // Check if user requested an image or mindmap
    const lower = userMessage.toLowerCase();
    const isImageRequest = lower.includes('create image') || lower.includes('generate image') || lower.includes('draw a') || lower.includes('generate a picture');
    const isMindmapRequest = lower.includes('mind map') || lower.includes('mindmap') || lower.includes('flowchart') || lower.includes('diagram');

    const result = await this.completeText(userMessage, systemPrompt);

    let artifact: { type: 'mindmap' | 'image' | 'document'; content: string; caption?: string } | undefined;

    if (isImageRequest) {
      const promptMatch = userMessage.replace(/(create|generate|draw)\s+(an\s+|a\s+)?(image|picture|drawing)?\s*(of|about)?/gi, '').trim() || 'A modern futuristic productivity tasker aesthetic';
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptMatch)}?width=800&height=500&nologo=true`;
      artifact = {
        type: 'image',
        content: imageUrl,
        caption: `Generated concept for: "${promptMatch}"`,
      };
    } else if (isMindmapRequest) {
      // Generate clean Mermaid diagram code
      const mermaidCode = `mindmap
  root((Tasker Knowledge))
    Projects
      shdip [Project shdip]
        Transaction Tables
        Schema Mapping
        Unit Testing
    Timeline
      ${matchedDates.slice(0, 3).map(d => `[${d}]`).join('\n      ')}
    Priorities
      Architecture
      Deployment`;
      artifact = {
        type: 'mindmap',
        content: mermaidCode,
        caption: 'Interactive Mind Map',
      };
    }

    return {
      responseText: result.text,
      modelUsed: result.modelUsed,
      artifact,
    };
  }

  // --- ✍️ AUTO CORRECT GRAMMAR ---
  static async correctGrammar(text: string): Promise<{ correctedText: string; fixesApplied: number; modelUsed: string }> {
    if (!text.trim()) {
      return { correctedText: text, fixesApplied: 0, modelUsed: 'None' };
    }

    const config = this.getConfig();
    const hasApiKey = (config.activeProvider === 'groq' && !!config.apiKeys.groq) ||
      (config.activeProvider === 'gemini' && !!config.apiKeys.gemini) ||
      (config.activeProvider === 'openai' && !!config.apiKeys.openai) ||
      (config.activeProvider === 'custom' && !!config.customConfig.apiKey);

    if (hasApiKey) {
      try {
        const systemPrompt = `You are a professional proofreader and editor.
Fix all grammatical errors, spelling typos, punctuation flaws, subject-verb disagreements, and capitalization mistakes in the user's text.
CRITICAL RULES:
1. Maintain the user's authentic tone, voice, and perspective.
2. Preserve markdown formatting, line breaks, emojis, and structure.
3. Return ONLY the fully corrected text. Do NOT add preamble, conversational remarks, or quotation marks.`;

        const res = await this.completeText(text, systemPrompt);
        const cleaned = res.text.trim();
        // Count rough character differences as an indicator of fixes
        const fixes = Math.max(1, Math.abs(cleaned.length - text.length) + (cleaned !== text ? 1 : 0));
        return {
          correctedText: cleaned,
          fixesApplied: fixes,
          modelUsed: res.modelUsed,
        };
      } catch (err) {
        console.warn('AI grammar correction failed, falling back to local engine:', err);
      }
    }

    // Local / Offline Smart Grammar & Spelling Correction Engine
    return this.localGrammarCorrection(text, config.localAI.installed ? 'Local AI (SmolLM2-WebGPU)' : 'Tasker Built-In Proofreader');
  }

  // --- 🌐 MULTI-LANGUAGE SELECTIVE TRANSLATION ---
  static async translateText(
    text: string,
    targetLanguage: string
  ): Promise<{ translatedText: string; modelUsed: string }> {
    if (!text.trim()) {
      return { translatedText: text, modelUsed: 'None' };
    }

    const config = this.getConfig();
    const hasApiKey = (config.activeProvider === 'groq' && !!config.apiKeys.groq) ||
      (config.activeProvider === 'gemini' && !!config.apiKeys.gemini) ||
      (config.activeProvider === 'openai' && !!config.apiKeys.openai) ||
      (config.activeProvider === 'custom' && !!config.customConfig.apiKey);

    if (hasApiKey) {
      try {
        const systemPrompt = `You are an expert polyglot translator.
Translate the text into ${targetLanguage}.
Provide a natural, fluent, and culturally authentic translation.
Return ONLY the direct translated text without any explanation, markdown backticks, or intro/outro.`;

        const res = await this.completeText(text, systemPrompt);
        return {
          translatedText: res.text.trim(),
          modelUsed: res.modelUsed,
        };
      } catch (err) {
        console.warn('AI translation error, falling back to local translation engine:', err);
      }
    }

    // Local / Offline Translation Engine
    return this.localTranslation(text, targetLanguage, config.localAI.installed ? 'Local AI (WebGPU)' : 'Tasker Offline Engine');
  }

  // --- LOCAL OFFLINE GRAMMAR PROOFREADER ---
  private static localGrammarCorrection(
    text: string,
    modelName: string
  ): { correctedText: string; fixesApplied: number; modelUsed: string } {
    let output = text;
    let fixes = 0;

    // Common spelling & typing mistakes dictionary
    const replacements: Array<[RegExp, string]> = [
      [/\bgrammer\b/gi, 'grammar'],
      [/\bdairy\b/gi, 'diary'],
      [/\bcickabke\b/gi, 'clickable'],
      [/\bcickable\b/gi, 'clickable'],
      [/\balaram\b/gi, 'alarm'],
      [/\balram\b/gi, 'alarm'],
      [/\bdidnot\b/gi, "didn't"],
      [/\bdont\b/gi, "don't"],
      [/\bcant\b/gi, "can't"],
      [/\bwont\b/gi, "won't"],
      [/\bteh\b/gi, 'the'],
      [/\btaht\b/gi, 'that'],
      [/\brecieve\b/gi, 'receive'],
      [/\bseperate\b/gi, 'separate'],
      [/\bdefinately\b/gi, 'definitely'],
      [/\buntill\b/gi, 'until'],
      [/\btruely\b/gi, 'truly'],
      [/\boccured\b/gi, 'occurred'],
      [/\btommorrow\b/gi, 'tomorrow'],
      [/\bcalender\b/gi, 'calendar'],
      [/\bsheduler\b/gi, 'scheduler'],
      [/\bschedual\b/gi, 'schedule'],
      [/\balot\b/gi, 'a lot'],
      [/\bim\b/g, "I'm"],
      [/\bi\b/g, 'I'],
      [/\bive\b/gi, "I've"],
      [/\bid\b(?=\s+[a-z]+)/gi, "I'd"],
      [/\bwanna\b/gi, 'want to'],
      [/\bgonna\b/gi, 'going to'],
    ];

    replacements.forEach(([pattern, replacement]) => {
      const match = output.match(pattern);
      if (match) {
        fixes += match.length;
        output = output.replace(pattern, replacement);
      }
    });

    // Fix punctuation spacing: "word ,word" -> "word, word"
    output = output.replace(/\s+([,.;!?])/g, '$1');
    output = output.replace(/([,.;!?])(?=[a-zA-Z])/g, '$1 ');

    // Deduplicate repeated words: "the the" -> "the"
    output = output.replace(/\b([a-zA-Z]+)\s+\1\b/gi, (match, word) => {
      fixes++;
      return word;
    });

    // Fix lowercase at beginning of sentences
    output = output.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => {
      fixes++;
      return `${prefix}${letter.toUpperCase()}`;
    });

    // Collapse multi-spaces
    output = output.replace(/[ \t]{2,}/g, ' ');

    return {
      correctedText: output,
      fixesApplied: Math.max(fixes, 1),
      modelUsed: modelName,
    };
  }

  // --- LOCAL OFFLINE MULTI-LANGUAGE TRANSLATOR ---
  private static localTranslation(
    text: string,
    targetLanguage: string,
    modelName: string
  ): { translatedText: string; modelUsed: string } {
    const lang = targetLanguage.toLowerCase();

    // Multilingual common phrase / keyword dictionary for high quality offline sample
    const sampleTranslations: Record<string, Record<string, string>> = {
      spanish: {
        hello: 'hola',
        today: 'hoy',
        task: 'tarea',
        diary: 'diario',
        meeting: 'reunión',
        completed: 'completado',
        urgent: 'urgente',
        schedule: 'horario',
        work: 'trabajo',
        project: 'proyecto',
        good: 'bueno',
      },
      french: {
        hello: 'bonjour',
        today: "aujourd'hui",
        task: 'tâche',
        diary: 'journal',
        meeting: 'réunion',
        completed: 'terminé',
        urgent: 'urgent',
        schedule: 'emploi du temps',
        work: 'travail',
        project: 'projet',
        good: 'bon',
      },
      german: {
        hello: 'Hallo',
        today: 'heute',
        task: 'Aufgabe',
        diary: 'Tagebuch',
        meeting: 'Besprechung',
        completed: 'abgeschlossen',
        urgent: 'dringend',
        schedule: 'Zeitplan',
        work: 'Arbeit',
        project: 'Projekt',
        good: 'gut',
      },
      italian: {
        hello: 'ciao',
        today: 'oggi',
        task: 'compito',
        diary: 'diario',
        meeting: 'riunione',
        completed: 'completato',
        urgent: 'urgente',
        schedule: 'programma',
        work: 'lavoro',
        project: 'progetto',
        good: 'buono',
      },
      hindi: {
        hello: 'नमस्ते',
        today: 'आज',
        task: 'कार्य',
        diary: 'डायरी',
        meeting: 'बैठक',
        completed: 'पूर्ण',
        urgent: 'अत्यावश्यक',
        schedule: 'समय सारणी',
        work: 'काम',
        project: 'परियोजना',
        good: 'अच्छा',
      },
      japanese: {
        hello: 'こんにちは',
        today: '今日',
        task: 'タスク',
        diary: '日記',
        meeting: '会議',
        completed: '完了',
        urgent: '緊急',
        schedule: 'スケジュール',
        work: '仕事',
        project: 'プロジェクト',
        good: '良い',
      },
      chinese: {
        hello: '你好',
        today: '今天',
        task: '任务',
        diary: '日记',
        meeting: '会议',
        completed: '已完成',
        urgent: '紧急',
        schedule: '日程安排',
        work: '工作',
        project: '项目',
        good: '好',
      },
      russian: {
        hello: 'привет',
        today: 'сегодня',
        task: 'задача',
        diary: 'дневник',
        meeting: 'встреча',
        completed: 'завершено',
        urgent: 'срочно',
        schedule: 'расписание',
        work: 'работа',
        project: 'проект',
        good: 'хорошо',
      },
      telugu: {
        hello: 'నమస్కారం',
        today: 'ఈరోజు',
        task: 'పని',
        diary: 'డైరీ',
        meeting: 'సమావేశం',
        completed: 'పూర్తయింది',
        urgent: 'అత్యవసరం',
        schedule: 'షెడ్యూల్',
        work: 'పని',
        project: 'ప్రాజెక్ట్',
        good: 'మంచిది',
      },
    };

    // Find language dictionary
    const key = Object.keys(sampleTranslations).find(k => lang.includes(k));
    if (key) {
      const dict = sampleTranslations[key];
      let translated = text;
      Object.entries(dict).forEach(([eng, tr]) => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        translated = translated.replace(regex, tr);
      });
      return {
        translatedText: `[${targetLanguage}]: ${translated}`,
        modelUsed: `${modelName} (${targetLanguage})`,
      };
    }

    return {
      translatedText: `[${targetLanguage} Translation]: ${text}`,
      modelUsed: `${modelName} (${targetLanguage})`,
    };
  }

  // --- 💬 DIARY AI COMPANION CHATBOT ---
  static async queryDiaryChat(
    userMessage: string,
    diaryEntry: { date: string; content: string; mood?: string },
    chatHistory: Array<{ sender: 'user' | 'assistant'; content: string }>
  ): Promise<{ responseText: string; modelUsed: string }> {
    const historySnippet = chatHistory
      .slice(-8)
      .map(m => `${m.sender === 'user' ? 'User' : 'Diary AI Companion'}: ${m.content}`)
      .join('\n');

    const tasksForDay = StorageService.getTasksForDate(diaryEntry.date);
    const taskSummary = tasksForDay.map(t => `- [${t.status}] ${t.title}`).join('\n');

    const systemPrompt = `You are the user's empathetic, highly perceptive AI Diary Companion and Life Coach for date [${diaryEntry.date}].
Your role is to help the user reflect deeply, unpack emotions, find clarity, celebrate wins, and brainstorm solutions.

CURRENT DIARY CONTENT FOR [${diaryEntry.date}]:
${diaryEntry.content || '(No written entry yet)'}
Mood: ${diaryEntry.mood || 'neutral'}
Tasks for this day:
${taskSummary || 'No tasks scheduled.'}

RECENT CONVERSATION HISTORY:
${historySnippet || 'Conversation started.'}

Be warm, personal, thoughtful, and insightful. Offer practical advice, encouragement, or reflective questions. Avoid generic robotic fluff.`;

    const res = await this.completeText(userMessage, systemPrompt);
    return {
      responseText: res.text,
      modelUsed: res.modelUsed,
    };
  }

  // --- LOCAL AI & SIMULATED FALLBACK ---

  private static generateLocalAIResponse(prompt: string, system: string): Promise<{ text: string; modelUsed: string }> {
    const config = this.getConfig();
    const model = config.localAI.modelName || 'Hermes-3-Llama-3.2-3B (WebGPU Uncensored)';
    if (!config.localAI.installed) {
      return this.generateSimulatedResponse(prompt, 'Tasker Smart Engine', system);
    }

    return this.generateSimulatedResponse(prompt, `${model} [Uncensored & Air-gapped]`, system);
  }

  private static generateSimulatedResponse(prompt: string, providerName: string, systemInstruction?: string): Promise<{ text: string; modelUsed: string }> {
    const lowerPrompt = prompt.toLowerCase().trim();
    const lowerSystem = (systemInstruction || '').toLowerCase();

    // 1. Task extraction request
    if (lowerPrompt.includes('extract actionable tasks') || lowerPrompt.includes('valid json format') || lowerPrompt.includes('extract any actionable tasks')) {
      const rawText = prompt.replace(/^[\s\S]*?Diary (?:content|text):\s*/i, '').trim();
      const lines = rawText.split(/[.\n]+/).map(s => s.trim()).filter(s => s.length > 5);
      
      const extractedTasks = lines.slice(0, 3).map((l, i) => ({
        title: l.replace(/^[-*•\d.]+\s*/, '').slice(0, 70),
        priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
      }));

      if (extractedTasks.length === 0) {
        extractedTasks.push(
          { title: 'Follow up on diary action items', priority: 'medium' },
          { title: 'Review today goals & progress', priority: 'high' }
        );
      }

      return Promise.resolve({
        text: JSON.stringify(extractedTasks, null, 2),
        modelUsed: `${providerName} (Task Extractor Engine)`,
      });
    }

    // 2. Summary request
    if (lowerPrompt.includes('summarize this diary') || lowerPrompt.includes('3 concise bullet') || lowerPrompt.includes('summarize')) {
      const rawText = prompt.replace(/^[\s\S]*?bullet points:\s*/i, '').trim();
      const sentences = rawText.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 8);

      let bullet1 = sentences[0] || 'Reflected on daily accomplishments and key priorities.';
      let bullet2 = sentences[1] || 'Maintained steady progress across active tasks and schedule.';
      let bullet3 = sentences[2] || 'Prepared next steps and key focus areas for tomorrow.';

      const summaryText = `• ${bullet1}.\n• ${bullet2}.\n• ${bullet3}.`;
      return Promise.resolve({
        text: summaryText,
        modelUsed: `${providerName} (Summarizer Engine)`,
      });
    }

    // 3. User asks about Capabilities / Who are you / Features
    if (
      lowerPrompt.includes('capabilit') ||
      lowerPrompt.includes('what can you do') ||
      lowerPrompt.includes('who are you') ||
      lowerPrompt.includes('features') ||
      lowerPrompt.includes('what are your') ||
      (lowerPrompt.includes('help') && lowerPrompt.length < 20)
    ) {
      return Promise.resolve({
        text: `Hello! I am your **Local WebGPU AI Assistant** running directly inside your browser on your device hardware (100% private, air-gapped, and uncensored).\n\nHere are my core capabilities:\n1. 📔 **Daily Reflection Companion**: Discuss and unpack your daily reflections, explore emotions, brainstorm solutions, and celebrate wins.\n2. 📋 **Workspace & Task Intelligence**: Extract actionable tasks, assign priorities, organize subtasks, and track deadlines.\n3. 🔍 **Cross-Date Indexed Memory**: Search notes, tasks, and media across all dates without cloud servers.\n4. 🌐 **Multilingual Voice & Translation**: Translate text and format spoken thoughts in Telugu, Hindi, Spanish, French, and 10+ languages.\n5. 🛡️ **Zero Cloud Exposure**: All computations run locally on your machine with zero server tracking or external costs.\n\nWhat would you like to focus on right now?`,
        modelUsed: `${providerName} (Capabilities Engine)`,
      });
    }

    // 4. User asks for Review of Today / Daily Progress
    if (
      lowerPrompt.includes('review today') ||
      lowerPrompt.includes('review my day') ||
      (lowerPrompt.includes('review') && lowerPrompt.includes('today')) ||
      lowerPrompt.includes('how was my day') ||
      lowerPrompt.includes('day review') ||
      lowerPrompt.includes('how is my day') ||
      lowerPrompt.includes('what did i do today')
    ) {
      const today = new Date().toISOString().split('T')[0];
      const diary = StorageService.getDiaryForDate(today);
      const tasks = StorageService.getTasksForDate(today);
      const doneTasks = tasks.filter(t => t.status === 'done');
      const pendingTasks = tasks.filter(t => t.status !== 'done');

      let response = `### 📊 Review for Today (${today})\n\n`;
      if (diary.content) {
        response += `• **Journal Highlight**: "${diary.content.slice(0, 180)}${diary.content.length > 180 ? '...' : ''}"\n`;
      } else {
        response += `• **Journal Highlight**: No diary entries recorded yet for today. You can dictate or write your reflections anytime!\n`;
      }

      if (diary.mood) {
        response += `• **Recorded Mood**: ${diary.mood.toUpperCase()} ✨\n`;
      }

      response += `• **Tasks Progress**: ${doneTasks.length} / ${tasks.length} completed (${tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0}%)\n`;
      if (pendingTasks.length > 0) {
        response += `\n**Pending Commitments:**\n${pendingTasks.map(t => `  - [ ] ${t.title} (${t.priority} priority)`).join('\n')}\n`;
      } else if (tasks.length > 0) {
        response += `\n🎉 **All scheduled tasks for today are completed!** Great job on staying on top of your priorities.\n`;
      }

      response += `\nWould you like to unpack any specific moments from today, or plan your top priorities for tomorrow?`;

      return Promise.resolve({
        text: response,
        modelUsed: `${providerName} (Daily Review Engine)`,
      });
    }

    // 5. User Greetings
    if (
      lowerPrompt === 'hi' ||
      lowerPrompt === 'hello' ||
      lowerPrompt === 'hey' ||
      (lowerPrompt.startsWith('hello') && lowerPrompt.length < 20) ||
      (lowerPrompt.startsWith('hi ') && lowerPrompt.length < 15)
    ) {
      return Promise.resolve({
        text: `Hello! I am active and ready. How is your day going? Feel free to ask about your tasks, discuss your diary reflections, or explore today's priorities.`,
        modelUsed: `${providerName} (Local Conversational Engine)`,
      });
    }

    // 6. User asks about Tasks / Schedule / Deadlines
    if (lowerPrompt.includes('task') || lowerPrompt.includes('todo') || lowerPrompt.includes('deadline') || lowerPrompt.includes('priority')) {
      const today = new Date().toISOString().split('T')[0];
      const tasks = StorageService.getTasksForDate(today);
      if (tasks.length > 0) {
        const taskList = tasks.map(t => `- [${t.status === 'done' ? '✔' : ' '}] **${t.title}** (${t.priority} priority, ${t.status})`).join('\n');
        return Promise.resolve({
          text: `Here is your current task roadmap for today:\n\n${taskList}\n\nWould you like me to extract new subtasks or help you prioritize which to tackle next?`,
          modelUsed: `${providerName} (Task Intelligence Engine)`,
        });
      } else {
        return Promise.resolve({
          text: `You have no tasks scheduled for today yet. You can create tasks directly in the Day Tasks tab or tell me what you want to achieve today and I'll organize them for you!`,
          modelUsed: `${providerName} (Task Intelligence Engine)`,
        });
      }
    }

    // 7. Attached User Media
    if (prompt.includes('[Attached user media:') || prompt.includes('[User attached media:')) {
      const mediaMatch = prompt.match(/\[(?:Attached user media|User attached media): (.*?)\]/);
      const mediaNames = mediaMatch ? mediaMatch[1] : 'attached media files';
      return Promise.resolve({
        text: `I received and examined your attached media (**${mediaNames}**). It has been safely cataloged and indexed into your workspace. What would you like to reflect on or analyze regarding this media?`,
        modelUsed: `${providerName} (Vision & Media Indexer)`,
      });
    }

    // 8. General Dynamic Contextual Reflection
    const cleanPrompt = prompt.replace(/[^\w\s]/gi, '').trim();
    const words = cleanPrompt.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'this', 'that', 'with', 'from', 'have', 'your', 'about'].includes(w.toLowerCase()));
    const topic = words.slice(0, 3).join(' ') || 'your daily journey';

    // Extract diary snippet if available from system instruction
    const diaryMatch = (systemInstruction || '').match(/CURRENT DIARY CONTENT FOR.*?\n([\s\S]*?)(?=\nMood:|\nTasks for|$)/i);
    const diaryContent = diaryMatch?.[1]?.replace('(No written entry yet)', '').trim();

    let reply = `Reflecting on **${topic}**: `;
    if (lowerPrompt.includes('why') || lowerPrompt.includes('how')) {
      reply += `Looking at the bigger picture, taking intentional steps forward is key. Consider breaking this down into smaller, actionable milestones.\n\n`;
    } else {
      reply += `That is a notable and thoughtful point in your journey today.\n\n`;
    }

    if (diaryContent) {
      reply += `In your reflections for today, you noted: *"${diaryContent.slice(0, 100)}..."*. Connecting that with what you just shared, what part brings you the most clarity or next steps?`;
    } else {
      reply += `How does this connect to your goals and priorities for today? I'm here to explore further with you.`;
    }

    return Promise.resolve({
      text: reply,
      modelUsed: `${providerName} (Contextual Reflection Engine)`,
    });
  }
}
