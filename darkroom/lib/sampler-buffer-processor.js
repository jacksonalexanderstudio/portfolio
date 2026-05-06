// darkroom: sampler rolling-buffer worklet.
// Sits as a passive tap on the source-side audio (between scratchOut and the
// FX chain). Accumulates incoming samples mono-summed (L+R)/2, posts batches
// to the main thread every BATCH_FRAMES samples. The main thread maintains
// a 60-second ring buffer that the waveform UI scrubs against.
//
// Pure tap: input is also written to output unchanged so the node can sit
// inline without cutting the audio chain.

const BATCH_FRAMES = 4096; // ~85ms at 48kHz — large enough to keep main-thread postMessage rate sane

class SamplerBufferProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._batch = new Float32Array(BATCH_FRAMES);
    this._writePos = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    const leftIn = input[0];
    const rightIn = input.length > 1 ? input[1] : input[0];
    const leftOut = output[0];
    const rightOut = output.length > 1 ? output[1] : output[0];
    const frameCount = leftIn.length;

    for (let i = 0; i < frameCount; i++) {
      const l = leftIn[i];
      const r = rightIn[i];
      // pass-through to output (this node is a tap, not a filter)
      if (leftOut)  leftOut[i]  = l;
      if (rightOut) rightOut[i] = r;
      // accumulate mono sum into batch
      this._batch[this._writePos++] = (l + r) * 0.5;
      if (this._writePos >= BATCH_FRAMES) {
        // post a copy so the worklet thread isn't blocked by main-thread reads
        this.port.postMessage(this._batch.slice(0));
        this._writePos = 0;
      }
    }
    return true;
  }
}

registerProcessor('sampler-buffer-processor', SamplerBufferProcessor);
