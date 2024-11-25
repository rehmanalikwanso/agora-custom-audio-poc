export const generateTwilioToken = async () => {
  try {
    const accountSid = process.env.REACT_APP_TWILIO_ACCOUNT_SID; // Your Twilio Account SID
    const apiKeySid = process.env.REACT_APP_TWILIO_ACCOUNT_SID_KEY;  // Your Twilio API Key SID
    const apiKeySecret = process.env.REACT_APP_TWILIO_ACCOUNT_SECRET; // Your Twilio API Key Secret

    // Token generation requires the Twilio Access Token format
    const tokenUrl = `https://twilio-token-server.com/generate?accountSid=${accountSid}&apiKeySid=${apiKeySid}&apiKeySecret=${apiKeySecret}`;

    const response = await fetch(tokenUrl);
    const data = await response.json();

    if (data.token) {
      return data.token;
      // setStatus('Token generated successfully!');
      // initializeDevice(data.token);
    }
    return ''
  } catch (error) {
    console.error('Error generating token:', error);
    // setStatus('Error generating token.');
  }
};