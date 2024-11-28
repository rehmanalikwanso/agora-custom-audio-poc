export const getTwilioToken = async () => {
  const response = await fetch('https://natgen-backend.vercel.app/token', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log(" >>>>>>>",response)
  const data = await response.json();
  return data.token;
};