/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  TextStreamer,
} from "@huggingface/transformers";

interface LLMState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  progress: number;
}

interface LLMInstance {
  model: any;
  tokenizer: any;
}

const moduleCache: {
  [modelId: string]: {
    instance: LLMInstance | null;
    loadingPromise: Promise<LLMInstance> | null;
  };
} = {};

export const useLLM = (modelId?: string) => {
  const [state, setState] = useState<LLMState>({
    isLoading: false,
    isReady: false,
    error: null,
    progress: 0,
  });

  const instanceRef = useRef<LLMInstance | null>(null);
  const loadingPromiseRef = useRef<Promise<LLMInstance> | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pastKeyValuesRef = useRef<any>(null);

  const loadModel = useCallback(async () => {
    if (!modelId) {
      throw new Error("Model ID is required");
    }

    const MODEL_ID = `onnx-community/LFM2-${modelId}-ONNX`;

    if (!moduleCache[modelId]) {
      moduleCache[modelId] = {
        instance: null,
        loadingPromise: null,
      };
    }

    const cache = moduleCache[modelId];

    const existingInstance = instanceRef.current || cache.instance;
    if (existingInstance) {
      instanceRef.current = existingInstance;
      cache.instance = existingInstance;
      setState((prev) => ({ ...prev, isReady: true, isLoading: false }));
      return existingInstance;
    }

    const existingPromise = loadingPromiseRef.current || cache.loadingPromise;
    if (existingPromise) {
      try {
        const instance = await existingPromise;
        instanceRef.current = instance;
        cache.instance = instance;
        setState((prev) => ({ ...prev, isReady: true, isLoading: false }));
        return instance;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to load model",
        }));
        throw error;
      }
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: 0,
    }));

    abortControllerRef.current = new AbortController();

    const loadingPromise = (async () => {
      try {
        const progressCallback = (progress: any) => {
          // Only update progress for weights
          if (
            progress.status === "progress" &&
            progress.file.endsWith(".onnx_data")
          ) {
            const percentage = Math.round(
              (progress.loaded / progress.total) * 100,
            );
            setState((prev) => ({ ...prev, progress: percentage }));
          }
        };

        const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
          progress_callback: progressCallback,
        });

        const model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
          dtype: "q4f16",
          device: "webgpu",
          progress_callback: progressCallback,
        });

        const instance = { model, tokenizer };
        instanceRef.current = instance;
        cache.instance = instance;
        loadingPromiseRef.current = null;
        cache.loadingPromise = null;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isReady: true,
          progress: 100,
        }));
        return instance;
      } catch (error) {
        loadingPromiseRef.current = null;
        cache.loadingPromise = null;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to load model",
        }));
        throw error;
      }
    })();

    loadingPromiseRef.current = loadingPromise;
    cache.loadingPromise = loadingPromise;
    return loadingPromise;
  }, [modelId]);

  const generateResponse = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      tools: Array<any>,
      onToken?: (token: string) => void,
    ): Promise<string> => {
      const instance = instanceRef.current;
      if (!instance) {
        throw new Error("Model not loaded. Call loadModel() first.");
      }

      const { model, tokenizer } = instance;

      // Apply chat template with tools
      const input = tokenizer.apply_chat_template(messages, {
        tools,
        add_generation_prompt: true,
        return_dict: true,
      });

      console.log('Chat template applied, input shape:', input?.input_ids?.dims || 'unknown');

      const streamer = onToken
        ? new TextStreamer(tokenizer, {
            skip_prompt: true,
            skip_special_tokens: false,
            callback_function: (token: string) => {
              if (token && token.trim()) {
                onToken(token);
              }
            },
          })
        : undefined;

      try {

        // Generate the response (reduced tokens for more concise responses)
        // Only pass past_key_values if it's valid to avoid "invalid data location" errors
        const generateOptions: any = {
          ...input,
          max_new_tokens: 200, // Reduced for more concise responses
          do_sample: false,
          temperature: 0.7, // Add some creativity while staying focused
          streamer,
          return_dict_in_generate: true,
        };

        // Only include past_key_values if it exists and is valid
        if (pastKeyValuesRef.current && pastKeyValuesRef.current !== null) {
          generateOptions.past_key_values = pastKeyValuesRef.current;
        }

        const { sequences, past_key_values } = await model.generate(generateOptions);
        pastKeyValuesRef.current = past_key_values;

        // Decode the generated text with special tokens preserved (except final <|im_end|>) for tool call detection
        const response = tokenizer
          .batch_decode(sequences.slice(null, [input.input_ids.dims[1], null]), {
            skip_special_tokens: false,
          })[0]
          .replace(/<\|im_end\|>$/, "");

        // Ensure we return a valid string
        return response || "I'm sorry, I couldn't generate a response. Please try again.";
      } catch (error) {
        console.error('Error during generation:', error);
        
        // If we get a past key values error, clear them and retry once
        if (error instanceof Error && (error.message.includes('past_conv') || error.message.includes('invalid data location'))) {
          console.warn('Clearing past key values due to data location error and retrying...');
          pastKeyValuesRef.current = null;
          
          // Retry without past_key_values
          try {
            const retryOptions: any = {
              ...input,
              max_new_tokens: 200,
              do_sample: false,
              temperature: 0.7,
              streamer: streamer,
              return_dict_in_generate: true,
            };

            const { sequences } = await model.generate(retryOptions);
            
            const response = tokenizer
              .batch_decode(sequences.slice(null, [input.input_ids.dims[1], null]), {
                skip_special_tokens: false,
              })[0]
              .replace(/<\|im_end\|>$/, "");

            return response || "I'm sorry, I couldn't generate a response. Please try again.";
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
            throw new Error(`Generation failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
          }
        }
        
        throw error;
      }
    },
    [],
  );

        const clearPastKeyValues = useCallback(() => {
    pastKeyValuesRef.current = null;
    console.log('Past key values cleared');
  }, []);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  useEffect(() => {
    if (modelId && moduleCache[modelId]) {
      const existingInstance =
        instanceRef.current || moduleCache[modelId].instance;
      if (existingInstance) {
        instanceRef.current = existingInstance;
        setState((prev) => ({ ...prev, isReady: true }));
      }
    }
  }, [modelId]);

  return {
    ...state,
    loadModel,
    generateResponse,
    clearPastKeyValues,
    cleanup,
  };
};
