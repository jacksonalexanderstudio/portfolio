// BEAT REPEAT — freeze-and-loop. OB-4 / Pioneer DJM beat-effects model.
//
// Two inputs from the main thread:
//   - `samplesPerChunk` parameter — the loop length in samples.
//       0 = disengaged (pass-through). >0 = engaged (loop is `chunk` samples long).
//   - `{rearm: true}` port message — explicit "capture from the live ring NOW."
//
// CAPTURE happens ONLY on rearm message + chunk > 0. Chunk-value changes alone
// do NOT trigger recapture — this isolates playback from BPM jitter, screw/rate
// nudges, or any other tempo-driven param updates. JS sends rearm only on user
// actions (engage, change division, RELEASE toggle).
//
// Once captured, samples live in a dedicated immutable loopBuf. The live ring
// keeps recording in parallel; when chunk drops to 0, playback drops back to
// "where the track naturally is" (the freeze counts as real elapsed time).

const PROCESSOR_NAME = 'beat-repeat-processor';
const WORKLET_VERSION = 3;

class BeatRepeatProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'samplesPerChunk', defaultValue: 0, minValue: 0, maxValue: sampleRate * 4, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.bufferLen = sampleRate * 4; // 4 seconds — enough for 1/1 at 60 BPM
    // Live ring — always recording the most recent 4 seconds.
    this.bufL = new Float32Array(this.bufferLen);
    this.bufR = new Float32Array(this.bufferLen);
    // Dedicated loop buffer — populated on capture, never overwritten by live
    // audio. Pre-allocated at max possible chunk size to avoid runtime allocs
    // on the audio thread.
    this.loopBufL = new Float32Array(this.bufferLen);
    this.loopBufR = new Float32Array(this.bufferLen);
    this.loopLen = 0; // active loop length in samples (0 = no capture)
    this.writePos = 0;
    this.readPos = 0;
    this.armRequested = false;
    this.engaged = false;

    this.port.onmessage = (e) => {
      if (e.data && e.data.rearm) this.armRequested = true;
    };
    // One-shot version ping so the main thread can verify the new worklet
    // actually loaded (Chrome's worklet module cache is sticky).
    this.port.postMessage({ workletVersion: WORKLET_VERSION });
  }

  // Snapshot the last `chunk` samples of the live ring into the loop buffer.
  // Two-segment copy with Float32Array.set() handles ring wrap without per-
  // sample loops — finishes well under 1ms even at max 4-second chunk.
  captureLoop(chunk) {
    const start = (this.writePos - chunk + this.bufferLen) % this.bufferLen;
    const head = Math.min(chunk, this.bufferLen - start);
    this.loopBufL.set(this.bufL.subarray(start, start + head), 0);
    this.loopBufR.set(this.bufR.subarray(start, start + head), 0);
    if (head < chunk) {
      this.loopBufL.set(this.bufL.subarray(0, chunk - head), head);
      this.loopBufR.set(this.bufR.subarray(0, chunk - head), head);
    }
    this.loopLen = chunk;
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length || !output[0] || !output[0].length) return true;
    const inL = input[0];
    const inR = input.length > 1 ? input[1] : input[0];
    const outL = output[0];
    const outR = output.length > 1 ? output[1] : output[0];
    const chunk = Math.max(0, params.samplesPerChunk[0] | 0);
    const frameCount = inL.length;

    // RECAPTURE only on explicit rearm request. Chunk-value drift (BPM jitter,
    // screw/rate nudges) is intentionally ignored — the captured loop holds
    // until the user changes division or disengages.
    if (chunk > 0 && this.armRequested) {
      this.captureLoop(chunk);
      this.readPos = 0;
      this.engaged = true;
      this.armRequested = false;
      this.port.postMessage({ trigger: true });
    } else if (chunk === 0) {
      this.engaged = false;
      this.armRequested = false; // drop any stale arm request when disengaged
    }

    for (let i = 0; i < frameCount; i++) {
      // Live ring always records — so the moment we disengage we drop back
      // to "where the track naturally is" rather than to the captured loop.
      this.bufL[this.writePos] = inL[i];
      this.bufR[this.writePos] = inR[i];

      if (this.engaged && this.loopLen > 0) {
        const lp = this.readPos % this.loopLen;
        outL[i] = this.loopBufL[lp];
        outR[i] = this.loopBufR[lp];
        this.readPos++;
      } else {
        outL[i] = inL[i];
        outR[i] = inR[i];
      }

      this.writePos = (this.writePos + 1) % this.bufferLen;
    }

    return true;
  }
}

registerProcessor(PROCESSOR_NAME, BeatRepeatProcessor);
