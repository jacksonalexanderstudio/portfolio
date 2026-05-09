// capture-processor.js
//
// Generic audio capture worklet. Sums input channels to mono and posts
// every 128-sample render quantum back to the main thread as a transferable
// Float32Array. Used by AMBIENT and REV DLY to build sample-accurate ring
// buffers — replaces the previous AnalyserNode polling approach which
// drifted vs audio time and produced audible crackle on reversed playback.
//
// One instance per consumer (ambient and revdelay each get their own).
// Worklet acts as a sink — its output is silent and not connected to
// anything; only the captured-data side-channel matters.
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input.length) return true;
    const ch0 = input[0];
    if (!ch0 || !ch0.length) return true;
    let mixed;
    if (input.length === 1) {
      mixed = new Float32Array(ch0.length);
      mixed.set(ch0);
    } else {
      mixed = new Float32Array(ch0.length);
      const inv = 1 / input.length;
      for (let i = 0; i < ch0.length; i++) {
        let s = 0;
        for (let ch = 0; ch < input.length; ch++) s += input[ch][i];
        mixed[i] = s * inv;
      }
    }
    this.port.postMessage(mixed, [mixed.buffer]);
    return true;
  }
}
registerProcessor('capture-processor', CaptureProcessor);
