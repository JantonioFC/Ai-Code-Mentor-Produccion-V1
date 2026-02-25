/**
 * Tests: hooks/useStreamingLesson.js (React Hook)
 * Covers: streamLesson, reset, SSE event parsing, error handling, progress tracking
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';
import { useStreamingLesson } from '../../hooks/useStreamingLesson.js';

// Polyfill for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// --- Mock fetch with ReadableStream ---
const mockFetch = jest.fn();
global.fetch = mockFetch;

function createSSEStream(events) {
  const encoder = new TextEncoder();
  const chunks = events.map((e) => `data: ${JSON.stringify(e)}\n\n`);
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

function mockStreamResponse(status, events) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    body: createSSEStream(events),
  });
}

describe('useStreamingLesson', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Initial state ====================
  describe('initial state', () => {
    it('returns correct initial values', () => {
      const { result } = renderHook(() => useStreamingLesson());

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.content).toBe('');
      expect(result.current.lesson).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(typeof result.current.streamLesson).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  // ==================== streamLesson ====================
  describe('streamLesson', () => {
    it('sets isStreaming to true during streaming', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start', context: {} },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      // After completion, isStreaming should be false
      expect(result.current.isStreaming).toBe(false);
    });

    it('sends POST request with correct body', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, []));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 2, dia: 3, pomodoroIndex: 1 });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/lessons/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semanaId: 2, dia: 3, pomodoroIndex: 1 }),
      });
    });

    it('accumulates content from chunk events', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'chunk', text: 'Hello ', accumulated: 6 },
        { type: 'chunk', text: 'World', accumulated: 11 },
        { type: 'end', data: { title: 'Test Lesson' } },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.content).toBe('Hello World');
    });

    it('sets lesson data on end event', async () => {
      const lessonData = { title: 'Intro to JS', content: 'Full lesson', exercises: [] };

      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'chunk', text: 'content', accumulated: 7 },
        { type: 'end', data: lessonData },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.lesson).toEqual(lessonData);
    });

    it('sets progress to 100 on end event', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'end', data: {} },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.progress).toBe(100);
    });

    it('calculates progress from accumulated length', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'chunk', text: 'x'.repeat(1500), accumulated: 1500 },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      // 1500/3000 * 100 = 50%
      expect(result.current.progress).toBe(50);
    });

    it('caps progress at 95 before end event', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'chunk', text: 'x'.repeat(5000), accumulated: 5000 },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.progress).toBe(95);
    });

    it('sets error from error event', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'error', error: 'Gemini API rate limit exceeded' },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.error).toBe('Gemini API rate limit exceeded');
    });
  });

  // ==================== Error handling ====================
  describe('error handling', () => {
    it('sets error on HTTP error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        body: createSSEStream([]),
      });

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.error).toBe('HTTP error: 500');
      expect(result.current.isStreaming).toBe(false);
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.error).toBe('Failed to fetch');
      expect(result.current.isStreaming).toBe(false);
    });

    it('sets isStreaming to false after error', async () => {
      mockFetch.mockRejectedValue(new Error('timeout'));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  // ==================== reset ====================
  describe('reset', () => {
    it('resets all state to initial values', async () => {
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'chunk', text: 'some content', accumulated: 12 },
        { type: 'end', data: { title: 'Lesson' } },
      ]));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.content).not.toBe('');

      act(() => {
        result.current.reset();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.content).toBe('');
      expect(result.current.lesson).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });

  // ==================== State reset on new stream ====================
  describe('state reset on new stream', () => {
    it('clears previous state when starting a new stream', async () => {
      // First stream with error
      mockFetch.mockRejectedValueOnce(new Error('first error'));

      const { result } = renderHook(() => useStreamingLesson());

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.error).toBe('first error');

      // Second stream - should clear error
      mockFetch.mockReturnValue(mockStreamResponse(200, [
        { type: 'start' },
        { type: 'end', data: { title: 'OK' } },
      ]));

      await act(async () => {
        await result.current.streamLesson({ semanaId: 1, dia: 1, pomodoroIndex: 0 });
      });

      expect(result.current.error).toBeNull();
      expect(result.current.lesson).toEqual({ title: 'OK' });
    });
  });
});
