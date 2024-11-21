// src/services/agora/permissions.ts
export const requestPermissions = async (): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => track.stop()); // Stop tracks after permissions are granted
    console.log('Permissions granted for audio and video');
  } catch (error) {
    console.error('Error requesting permissions:', error);
    throw new Error('Permissions denied');
  }
};
