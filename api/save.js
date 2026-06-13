import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { text } = request.body;
    if (!text) {
      return response.status(400).json({ error: 'Text is required' });
    }
    
    // Generate a short 8-character ID
    const id = Math.random().toString(36).substring(2, 10);
    
    // Save to Vercel KV with a 14-day expiration (1209600 seconds)
    await kv.set(id, text, { ex: 1209600 });
    
    return response.status(200).json({ id });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
