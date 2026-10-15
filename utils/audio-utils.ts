
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  try {
    if (!base64 || typeof base64 !== 'string') {
      return new Uint8Array(0);
    }
    // Remove potential data URI prefix if present
    const cleanBase64 = base64.trim().replace(/^data:[^;]+;base64,/, '');
    // Strip any whitespaces or non-base64 characters
    const strippedBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Ensure correct base64 padding
    let paddedBase64 = strippedBase64;
    while (paddedBase64.length % 4 !== 0) {
      paddedBase64 += '=';
    }

    const binaryString = atob(paddedBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn("Base64 decoding failed or invalid pattern:", err);
    return new Uint8Array(0);
  }
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 PCM to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
