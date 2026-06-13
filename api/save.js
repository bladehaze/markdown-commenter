import { createClient } from 'redis';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }
  
  let client;
  try {
    const { text } = request.body;
    if (!text) {
      return response.status(400).json({ error: 'Text is required' });
    }
    
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
    
    // Generate a short 8-character ID
    const id = Math.random().toString(36).substring(2, 10);
    
    // Save to Redis with a 24-hour expiration (86400 seconds)
    await client.set(id, text, { EX: 86400 });
    
    return response.status(200).json({ id });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  } finally {
    if (client) await client.disconnect();
  }
}
