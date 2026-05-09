// bitcrush-processor.js
//
// Sample-rate decimator for the BITCRUSH module. Pure sample-and-hold:
// holds each input sample for `stride` output samples where stride is
// derived from the `rate` AudioParam (rate=1.0 = no decimation, rate=0.1
// = hold for 10 samples = 10× downsample with aliasing). Stereo-aware.
//
// Lives upstream of the bit-depth waveshaper in the bitcrush chain so
// the two crush axes compose naturally:
//   bitcrushIn → [this rate worklet] → bitcrush (waveshaper) → bitcrushWet
class BitcrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'rate',
      defaultValue: 1.0,
      minValue: 0.01,
      maxValue: 1.0,
      automationRate: 'k-rate'
    }];
  }
  constructor() {
    super();
    this.held = [0, 0];
    this.counter = 0;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;
    const rate = parameters.rate[0];
    // Stride: how many output samples each input sample is held for.
    // rate=1 → stride=1 (passthrough). rate=0.1 → stride=10.
    const stride = Math.max(1, Math.round(1 / rate));
    const blockSize = input[0].length;
    const channels = Math.min(input.length, output.length);
    for (let i = 0; i < blockSize; i++) {
      const refresh = this.counter % stride === 0;
      for (let ch = 0; ch < channels; ch++) {
        if (refresh) this.held[ch] = input[ch][i];
        output[ch][i] = this.held[ch];
      }
      this.counter++;
    }
    return true;
  }
}
registerProcessor('bitcrush-processor', BitcrushProcessor);
