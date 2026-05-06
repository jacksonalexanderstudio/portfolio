// SCRATCH — turntable-style positional playback. Maintains a 30-second rolling
// ring buffer of the live signal. A "needle" pointer reads samples at any
// velocity (positive = forward, negative = reverse, zero = silence) with linear
// interpolation for fractional positions.
//
// Behavior:
//   scratching = 0 → pass-through (live audio flows unchanged), needle tracks
//                    current write head so the next scratch starts from "now"
//   scratching = 1 → output reads from needlePos, advancing by `velocity`
//                    samples per output sample
//
// The needle is clamped to the past — it can't move beyond the write head
// (future audio doesn't exist yet) and can't go further back than bufferLen
// ago (oldest buffered audio).

const PROCESSOR_NAME = 'scratch-processor';

class ScratchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'velocity',   defaultValue: 1.0, minValue: -8, maxValue: 8, automationRate: 'a-rate' },
      { name: 'scratching', defaultValue: 0,   minValue: 0,  maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  constructor() {
    super();
    this.bufferLen = sampleRate * 30; // 30 seconds rolling
    this.bufL = new Float32Array(this.bufferLen);
    this.bufR = new Float32Array(this.bufferLen);
    this.writePos = 0;
    this.needlePos = 0; // float — fractional samples allowed for smooth pitch
  }

  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length || !output[0] || !output[0].length) return true;
    const inL = input[0];
    const inR = input.length > 1 ? input[1] : input[0];
    const outL = output[0];
    const outR = output.length > 1 ? output[1] : output[0];

    const vParam = params.velocity;
    const scratching = params.scratching[0] > 0.5;
    const frameCount = inL.length;
    const N = this.bufferLen;

    for (let i = 0; i < frameCount; i++) {
      // Always write live to the ring buffer
      this.bufL[this.writePos] = inL[i];
      this.bufR[this.writePos] = inR[i];

      if (scratching) {
        // Read at fractional needle position with linear interpolation
        let np = ((this.needlePos % N) + N) % N;
        const i0 = Math.floor(np);
        const i1 = (i0 + 1) % N;
        const frac = np - i0;
        outL[i] = this.bufL[i0] * (1 - frac) + this.bufL[i1] * frac;
        outR[i] = this.bufR[i0] * (1 - frac) + this.bufR[i1] * frac;

        // Advance needle by the current velocity (a-rate so it can vary per sample)
        const v = vParam.length > 1 ? vParam[i] : vParam[0];
        this.needlePos += v;

        // Clamp: needle must stay in [writePos - (N-1), writePos] — the past
        // 30s window. Use modular distance from writePos.
        // Treat the buffer as a circular timeline; convert to "samples behind
        // writePos" and clamp to [0, N-1].
        // (writePos is one ahead since we just wrote.)
        let behind = (this.writePos - this.needlePos + N) % N;
        if (behind < 1) {
          // needle caught up to the future — pin to current write
          this.needlePos = this.writePos;
        } else if (behind > N - 1) {
          // needle ran out of past — pin to oldest available sample
          this.needlePos = (this.writePos - (N - 1) + N) % N;
        }
      } else {
        // pass-through: output live, snap needle to write head so the next
        // scratch starts from "now"
        outL[i] = inL[i];
        outR[i] = inR[i];
        this.needlePos = this.writePos;
      }

      this.writePos = (this.writePos + 1) % N;
    }

    return true;
  }
}

registerProcessor(PROCESSOR_NAME, ScratchProcessor);
