export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const credentials = {
    proctor: {
      email: process.env.EVENTPASS_DEMO_PROCTOR_EMAIL,
      password: process.env.EVENTPASS_DEMO_PROCTOR_PASSWORD,
    },
    incharge: {
      email: process.env.EVENTPASS_DEMO_INCHARGE_EMAIL,
      password: process.env.EVENTPASS_DEMO_INCHARGE_PASSWORD,
    },
  };

  const configured = Object.values(credentials).every(
    (account) => account.email && account.password
  );

  if (process.env.EVENTPASS_DEMO_CREDENTIALS_PUBLIC !== 'true' || !configured) {
    return response.status(503).json({ enabled: false });
  }

  return response.status(200).json({
    enabled: true,
    accounts: credentials,
  });
}