/**
 * SpeechRecognitionService
 * Handles speech-to-text conversion using OpenAI Whisper
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default class SpeechRecognitionService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not set. Speech recognition will be limited.');
    }
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(audioBuffer, filename = 'audio.webm') {
    try {
      if (!this.openai) {
        throw new Error('OpenAI API key not configured');
      }

      // Create a temporary file from buffer using cross-platform temp directory
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, `${Date.now()}-${filename}`);
      fs.writeFileSync(tempPath, audioBuffer);

      // Transcribe using Whisper
      const transcript = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-1',
        language: 'en',
      });

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return {
        text: transcript.text,
        confidence: 0.95, // Whisper doesn't provide confidence, assume high
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Transcribe from URL
   */
  async transcribeFromUrl(audioUrl) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI API key not configured');
      }

      // Download audio from URL
      const response = await fetch(audioUrl);
      const audioBuffer = await response.arrayBuffer();

      return this.transcribeAudio(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('Error transcribing from URL:', error);
      throw error;
    }
  }

  /**
   * Validate audio quality
   */
  validateAudioQuality(audioBuffer) {
    // Basic validation - check if buffer is not empty and reasonable size
    if (!audioBuffer || audioBuffer.length === 0) {
      return { valid: false, reason: 'Empty audio' };
    }

    if (audioBuffer.length < 4000) {
      return { valid: false, reason: 'Audio too short (< 0.25 seconds)' };
    }

    if (audioBuffer.length > 25 * 1024 * 1024) {
      return { valid: false, reason: 'Audio too large (> 25MB)' };
    }

    return { valid: true };
  }

  /**
   * Get audio metadata
   */
  getAudioMetadata(audioBuffer) {
    // Simplified metadata extraction
    // In a real implementation, this would parse the audio format
    
    const byteLength = audioBuffer ? audioBuffer.length : 0;
    // Rough estimate: 16-bit PCM at 16kHz = 32kB per second
    const estimatedDuration = Math.round(byteLength / 32000);

    return {
      duration: Math.max(1, estimatedDuration),
      format: 'webm/opus',
      sampleRate: 16000,
      channels: 1,
    };
  }
}
