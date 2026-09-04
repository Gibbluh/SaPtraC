const axios = require('axios');

const sendSMS = async ({ number, message }) => {
  if (!number) {
    throw new Error('Driver phone number is missing.');
  }

  const response = await axios.post(
    process.env.ANDROID_SMS_GATEWAY_URL,
    {
      number,
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ANDROID_SMS_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

module.exports = {
  sendSMS,
};