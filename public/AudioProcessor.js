class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
console.log("?????????????????/", input[0])
    if (input && input[0]) {
      // Simple pass-through logic
      const inputChannel = input[0];
      const outputChannel = output[0];

      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i]; // Copy input to output
      }
    }

    return true; // Keep the processor running
  }
}

// Register the processor
registerProcessor("audio-processor", AudioProcessor);



// With Socket
class SocketAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioBufferQueue = [];

    this.port.onmessage = (event) => {

      // console.log("event.data>>>>>>>>>>", event);
      if (event.data && event.data.audioBuffer) {
        this.audioBufferQueue.push(event.data.audioBuffer);
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    // console.log("this.audioBufferQueue.length",  this.audioBufferQueue)
    if (this.audioBufferQueue.length > 0) {
      // console.log("event.data>>>>>>>>>> final", this.audioBufferQueue.shift());
      const audioBuffer = this.audioBufferQueue.shift();
      const outputChannel = output[0];
      console.log("audioBuffer>>>>>>>>>", audioBuffer)
      for (let i = 0; i < audioBuffer?.length; i++) {
        outputChannel[i] = audioBuffer[i];
      }
    } else {
      // If no data, output silence
      output[0].fill(0);
    }

    return true;
  }
}

registerProcessor("socket-audio-processor", SocketAudioProcessor);
