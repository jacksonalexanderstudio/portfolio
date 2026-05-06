// RECORDER — passive Float32 PCM tap. Sits in parallel off the master output
// (post-limiter, post-OUT-gain). When recording is enabled via port message
// {type:'start'}, every audio block accumulates into batch buffers; on every
// BATCH_FRAMES samples we postMessage a transferable copy to the main thread,
// which appends to growing per-channel arrays. On {type:'stop'} we flush any
// remaining samples and the main thread encodes the accumulator as a 16-bit
// PCM WAV file. SP-404 model — real-time, what you hear is what you get.
//
// Design notes:
// - BATCH_FRAMES of 8192 = ~170ms latency at 48kHz between sample arrival and
//   port delivery. Plenty fine for offline write; not in the audio path.
// - Transferable buffers (second arg of postMessage) keep zero-copy semantics
//   and avoid GC churn at sustained recording.
// - Worklet outputs silence regardless — the parent connects this as a parallel
//   tap, never as an in-line node. We don't pass-through.

const PROCESSOR_NAME = 'recorder-processor';
const BATCH_FRAMES = 8192;

class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.batchL = new Float32Array(BATCH_FRAMES);
    this.batchR = new Float32Array(BATCH_FRAMES);
    this.batchPos = 0;
    this.recording = false;
    this.port.onmessage = (e) => {
      if (!e.data) return;
      if (e.data.type === 'start') {
        this.recording = true;
        this.batchPos = 0;
      } else if (e.data.type === 'stop') {
        this.recording = false;
        this.flushBatch();
        this.port.postMessage({ type: 'stopped' });
      }
    };
  }

  flushBatch() {
    if (this.batchPos === 0) return;
    const outL = new Float32Array(this.batchPos);
    const outR = new Float32Array(this.batchPos);
    outL.set(this.batchL.subarray(0, this.batchPos));
    outR.set(this.batchR.subarray(0, this.batchPos));
    this.port.postMessage({ samples: [outL, outR] }, [outL.buffer, outR.buffer]);
    this.batchPos = 0;
  }

  process(inputs) {
    if (!this.recording) return true;
    const input = inputs[0];
    if (!input || !input.length) return true;
    const inL = input[0];
    const inR = input.length > 1 ? input[1] : input[0];
    const frameCount = inL.length;
    for (let i = 0; i < frameCount; i++) {
      this.batchL[this.batchPos] = inL[i];
      this.batchR[this.batchPos] = inR[i];
      this.batchPos++;
      if (this.batchPos >= BATCH_FRAMES) this.flushBatch();
    }
    return true;
  }
}

registerProcessor(PROCESSOR_NAME, RecorderProcessor);
