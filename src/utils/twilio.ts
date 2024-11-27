export const getTwilioToken = async () => {
  const response = await fetch('https://29e3-182-176-115-44.ngrok-free.app/token', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log(" >>>>>>>",response)
  const data = await response.json();
  return data.token;
};