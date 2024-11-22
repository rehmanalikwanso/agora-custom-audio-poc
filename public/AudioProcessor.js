// src/AudioProcessor.js

class AudioProcessor extends AudioWorkletProcessor {

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // Simple pass-through processor (you can apply effects here if needed)
    if (input && input[0] && output && output[0]) {
      for (let i = 0; i < input[0].length; i++) {
        output[0][i] = input[0][i]; 
      }
    } else {
      console.log('No input data available for processing');
    }

    return true;
  }
}

registerProcessor('audioProcessor', AudioProcessor);

export default AudioProcessor;
