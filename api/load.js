import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  const { id } = request.query;
  if (!id) {
    return response.status(400).json({ error: 'ID is required' });
  }
  
  try {
    const text = await kv.get(id);
    if (!text) {
      return response.status(404).json({ error: 'Document not found or expired' });
    }
    
    return response.status(200).json({ text });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.message });
  }
}
