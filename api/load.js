import { createClient } from 'redis';

export default async function handler(request, response) {
  const { id } = request.query;
  if (!id) {
    return response.status(400).json({ error: 'ID is required' });
  }
  
  let client;
  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', err => console.error('Redis Client Error', err));
    await client.connect();
    
    const text = await client.get(id);
    if (!text) {
      return response.status(404).json({ error: 'Document not found or expired' });
    }
    
    return response.status(200).json({ text });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  } finally {
    if (client) await client.disconnect();
  }
}
