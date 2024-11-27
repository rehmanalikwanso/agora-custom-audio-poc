// src/services/agora/rtcClient.ts
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalAudioTrack
} from 'agora-rtc-sdk-ng';
let rtcClient: IAgoraRTCClient | null = null;

export const initRTCClient = (): IAgoraRTCClient => {
  if (!rtcClient) {
    rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return rtcClient;
};

export const createLocalTracks = async (): Promise<{
  videoTrack: ICameraVideoTrack;
  audioTrack: ILocalAudioTrack;
}> => {
  try {
    const cameraDevices = await AgoraRTC.getCameras(false);
    const deviceId = cameraDevices.length > 1 && cameraDevices[0]['label'] === 'FaceTime HD Camera'
      ? cameraDevices[1]['deviceId']
      : cameraDevices[0]['deviceId'];

    const videoTrack: ICameraVideoTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: deviceId,
      encoderConfig: '720p_6',
      optimizationMode: 'motion',
    });

    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Extract the audio track from the media stream
    const mediaStreamTrack = mediaStream.getAudioTracks()[0];

    console.log("Audio stream track", mediaStreamTrack)

    // Create a custom audio track for Agora
    const audioTrack: ILocalAudioTrack = AgoraRTC.createCustomAudioTrack({
      mediaStreamTrack,
    });

    return { videoTrack, audioTrack };
  } catch (error) {
    console.error('Error creating local tracks:', error);
    throw error;
  }
};
export const createCustomerLocalTracks = async (): Promise<{
  videoTrack: ICameraVideoTrack;
}> => {
  try {
    const cameraDevices = await AgoraRTC.getCameras(false);
    const deviceId = cameraDevices[0]?.deviceId || '';

    const videoTrack: ICameraVideoTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: deviceId,
      encoderConfig: '720p_6',
      optimizationMode: 'motion',
    });

    return { videoTrack };
  } catch (error) {
    console.error('Error creating local tracks:', error);
    throw error;
  }
};

function int16ToFloat32(inputArray: Int16Array): Float32Array {
  var output = new Float32Array(inputArray.length);
  for (var i = 0; i < inputArray.length; i++) {
    var int = inputArray[i];
    // If the high bit is on, then it is a negative number, and actually counts backwards.
    var float = (int >= 0x8000) ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
    output[i] = float;
  }
  return output;
}

export const createAudioTrackFromAudioWorkletWithSocket = async (
  audioContext: AudioContext,
  socket: WebSocket
): Promise<MediaStreamTrack> => {
  const workletNode = new AudioWorkletNode(audioContext, "socket-audio-processor");
  const mediaStreamDestination = audioContext.createMediaStreamDestination();
  workletNode.connect(mediaStreamDestination);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "media") {
      const payload = data.payload;

      if (Array.isArray(payload.data)) {
        const byteArray = new Uint8Array(payload.data);
        const int16Array = new Int16Array(byteArray.buffer);
        const float32Array = int16ToFloat32(int16Array);

        // Ensure chunks of size 128
        const chunkSize = 128;
        const totalChunks = Math.ceil(float32Array.length / chunkSize);
        let chunks: Float32Array[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, float32Array.length);

          // Fill a Float32Array with the required chunk size
          const chunk = new Float32Array(chunkSize);
          chunk.set(float32Array.slice(start, end), 0); // Fill with available data
          chunks.push(chunk);
        }

        // Send each chunk to the audio worklet
        chunks.forEach((chunk) => workletNode.port.postMessage({ audioBuffer: chunk }));
      }
    }
  };

  return mediaStreamDestination.stream.getAudioTracks()[0];
};


export const createAudioTrackFromAudioWorkletWithoutSocket = async (audioContext: AudioContext): Promise<MediaStreamTrack> => {

  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
  const workletNode = new AudioWorkletNode(audioContext, "audio-processor");
  const mediaStreamDestination = audioContext.createMediaStreamDestination();

  // Connect nodes
  mediaStreamSource.connect(workletNode);
  workletNode.connect(mediaStreamDestination);

  return mediaStreamDestination.stream.getAudioTracks()[0]
}

export const createAudioTrackFromLocalStreamWithProcessor = async (
  audioContext: AudioContext
): Promise<MediaStreamTrack> => {
  try {
    // Capture the microphone stream
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

    // Create a ScriptProcessorNode for processing
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    const mediaStreamDestination = audioContext.createMediaStreamDestination();

    // Attach audio processing logic
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      console.log(">>>>>>>>>>>>>>>>>>>>", audioProcessingEvent)
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const outputBuffer = audioProcessingEvent.outputBuffer;

      // Process input data and copy to output buffer
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const input = inputBuffer.getChannelData(channel);
        const output = outputBuffer.getChannelData(channel);
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i]; // Simple pass-through
        }
      }
    };

    // Connect the processing nodes
    mediaStreamSource.connect(scriptProcessor);
    scriptProcessor.connect(mediaStreamDestination);

    console.log("Processed MediaStreamTrack:", mediaStreamDestination.stream.getAudioTracks()[0]);

    return mediaStreamDestination.stream.getAudioTracks()[0];
  } catch (error) {
    console.error("Error creating audio track with processor:", error);
    throw error;
  }
};

export const createAudioTrackFromLocalStreamWithProcessorSocket = async (
  audioContext: AudioContext,
  socket: WebSocket
): Promise<MediaStreamTrack> => {
  try {
    // Capture the microphone stream
    // const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

    // Create a ScriptProcessorNode for processing
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    socket.onmessage = (event: MessageEvent) => {

      const data = JSON.parse(event.data);

      console.log("Message received", data.payload);

      if (data.type === "media") {
        const audioData = data.payload instanceof ArrayBuffer ? data.payload : data.payload.buffer;

        audioContext.decodeAudioData(audioData)
          .then((decodedAudioBuffer) => {
            const source = audioContext.createBufferSource();
            source.buffer = decodedAudioBuffer;

            // Connect source to the script processor for potential processing
            source.connect(scriptProcessor);
            scriptProcessor.connect(mediaStreamDestination);

            // Start playback
            source.start();
          })
          .catch((error) => {
            console.error("Error decoding audio data:", error);
          });

      }

    }
    // Attach audio processing logic
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      console.log("Message received from the audio precess", audioProcessingEvent);

      const inputBuffer = audioProcessingEvent.inputBuffer;
      const outputBuffer = audioProcessingEvent.outputBuffer;

      // Process input data and copy to output buffer
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const input = inputBuffer.getChannelData(channel);
        const output = outputBuffer.getChannelData(channel);
        for (let i = 0; i < input.length; i++) {
          output[i] = input[i]; // Simple pass-through
        }
      }
    };

    // Connect the processing nodes
    // mediaStreamSource.connect(scriptProcessor);
    // scriptProcessor.connect(mediaStreamDestination);

    console.log("Processed MediaStreamTrack:", mediaStreamDestination.stream.getAudioTracks()[0]);

    return mediaStreamDestination.stream.getAudioTracks()[0];
  } catch (error) {
    console.error("Error creating audio track with processor:", error);
    throw error;
  }
};

// const createAudioTrackFromTwilioStream = () => {
//   const socket = useSocketStore.getInitialState().socket
//   const audioContext = new AudioContext();
//   const audioSource = audioContext.createMediaStreamSource(new MediaStream());
//   socket?.on("Uptok_audio_chat", (event) => {
//     console.log("event", event);
//     audioSource.connect(event.data)
//   })
//   return audioSource.mediaStream.getAudioTracks()[0];
// }

// const base64ToArrayBuffer = (base64: string) => {
//   const binaryString = atob(base64);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes.buffer;
// };

// const convertWaveData = (data:string) => {
//   let wav = new WaveFile();

//   // Twilio uses MuLaw so we have to encode for that
//   wav.fromScratch(1, 8000, "8m", Buffer.from(data, "base64"));

//   // This library has a handy method to decode MuLaw straight to 16-bit PCM
//   wav.fromMuLaw();

//   // Get the raw audio data in base64
//   const twilio64Encoded = wav.toDataURI().split("base64,")[1];

//   // Create our audio buffer
//   const twilioAudioBuffer = Buffer.from(twilio64Encoded, "base64");

//   // Send data starting at byte 44 to remove wav headers so our model sees only audio data
//   return twilioAudioBuffer.subarray(44)

//   // return twilioAudioBuffer.slice(44);
//   // wav.fromBuffer(twilioAudioBuffer)
// }
// const createAudioTrackFromTwilioStream = (audioContext: AudioContext, socket:WebSocket) => {
//   console.log("\n\n\n\n\n\n\n\n\nBEfore >>>>>>>>>>>>.")
//   const audioProcessorNode = new AudioWorkletNode(audioContext, 'audioProcessor');
//   const mediaStreamDestination = audioContext.createMediaStreamDestination();
//   console.log("\n\n\n\n\n\n\n\n\nafter >>>>>>>>>>>>.", socket)

//   // Create an AudioWorkletNode from the custom processor

//   audioProcessorNode.connect(mediaStreamDestination);
//   // if (socket) {
//     // console.log("Connecting to")
//     (socket as WebSocket).onmessage = async (event) => {
//       const data = JSON.parse(event.data); // Assuming server sends JSON
//       console.log("Message received", data.payload);
//       if (data.type === "media") {
//         try {
//           if (data.payload) {
//             const wav = new WaveFile();
//             wav.fromScratch(1, 8000, "8m", Buffer.from(data.payload, "base64"));
//             wav.fromMuLaw();

//             // let wav = new WaveFile();

//             // // Twilio uses MuLaw so we have to encode for that
//             // wav.fromScratch(1, 8000, "8m", Buffer.from(data, "base64"));

//             // // This library has a handy method to decode MuLaw straight to 16-bit PCM
//             // wav.fromMuLaw();

//             const pcmBuffer = Buffer.from(wav.toDataURI().split("base64,")[1], "base64").subarray(44);


//             // // Get the raw audio data in base64
//             // const twilio64Encoded = wav.toDataURI().split("base64,")[1];

//             // // Create our audio buffer
//             // const twilioAudioBuffer = Buffer.from(twilio64Encoded, "base64");

//             // // Send data starting at byte 44 to remove wav headers so our model sees only audio data
//             // const audioBuffer = twilioAudioBuffer.subarray(44).buffer

//             // const audioBuffer = convertWaveData(data.payload);
//             // audioBuffer.buffer
//             const source = audioContext.createBufferSource();
//             const decodedBuffer = await audioContext.decodeAudioData(pcmBuffer.buffer);
//             source.buffer = decodedBuffer

//             // Connect the source to the audio processor node
//             source.connect(audioProcessorNode);
//             // audioProcessorNode.connect(audioContext.destination); // Connect to speakers
//             source.start();
//           }

//         } catch (err) {
//           console.error('Error decoding audio data:', err);
//         }

//       }
//     };
//   // }


//   console.log("Media Stream >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",mediaStreamDestination.stream.getAudioTracks())

//   return mediaStreamDestination.stream.getAudioTracks()[0];
// }

export const joinChannel = async (
  client: IAgoraRTCClient,
  appId: string,
  channel: string,
  token: string | null,
  userId: string
): Promise<void> => {
  try {
    await client.join(appId, channel, token, userId);
    console.log(`Joined channel: ${channel}`);
  } catch (error) {
    console.error('Error joining channel:', error);
    throw error;
  }
};

export const leaveChannel = async (client: IAgoraRTCClient): Promise<void> => {
  try {
    await client.leave();
    console.log('Left the channel');
  } catch (error) {
    console.error('Error leaving channel:', error);
  }
};
