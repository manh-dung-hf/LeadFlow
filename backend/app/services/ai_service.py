import requests
import json
from flask import current_app


class AIService:
    def __init__(self, base_url=None, model=None):
        self.base_url = base_url or current_app.config['OLLAMA_BASE_URL']
        self.model = model or current_app.config['OLLAMA_MODEL']
        self.embed_model = current_app.config.get('OLLAMA_EMBED_MODEL', 'nomic-embed-text')

    def _call_ollama(self, prompt, format_json=True):
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
            }
            if format_json:
                payload["format"] = "json"
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120,
            )
            result = response.json()
            if format_json:
                return json.loads(result['response'])
            return result['response']
        except Exception as e:
            print(f"Ollama call error: {e}")
            return None

    def process_lead(self, lead_content):
        prompt = f"""Analyze the following sales lead message and return a JSON object with:
- language: detected language (e.g. "English", "Vietnamese")
- intent: classification (inquiry, complaint, feedback, partnership, other)
- temperature: HOT, WARM, or COLD
- product_interest: extracted product interest or "None"
- budget: extracted budget or "Unknown"
- urgency: HIGH, MEDIUM, or LOW
- summary: brief summary of the lead (1-2 sentences)
- suggested_reply: a professional reply in the detected language
- next_action: recommended next step for sales team

Lead message: "{lead_content}"

Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def suggest_follow_up(self, lead_data, conversation_history=""):
        prompt = f"""You are a sales AI assistant. Based on the lead information and conversation history,
suggest a follow-up message and next action.

Lead Info:
- Name: {lead_data.get('name', 'Unknown')}
- Status: {lead_data.get('status', 'Unknown')}
- Temperature: {lead_data.get('temperature', 'Unknown')}
- Product Interest: {lead_data.get('product_interest', 'Unknown')}
- Budget: {lead_data.get('budget', 'Unknown')}
- Last Contact: {lead_data.get('updated_at', 'Unknown')}

Conversation History:
{conversation_history or 'No previous conversation'}

Return a JSON object with:
- follow_up_message: the suggested follow-up message
- next_action: recommended action (call, email, whatsapp, demo, quote, close)
- urgency: HIGH, MEDIUM, LOW
- reason: why this follow-up is recommended

Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def modify_script(self, script_content, lead_data, context=""):
        prompt = f"""You are a sales AI assistant. Modify the following sales script to be personalized
for this specific lead. Keep the core message but adapt tone, language, and details.

Original Script:
{script_content}

Lead Info:
- Name: {lead_data.get('name', 'Customer')}
- Country: {lead_data.get('country', 'Unknown')}
- Language: {lead_data.get('language', 'English')}
- Product Interest: {lead_data.get('product_interest', 'Unknown')}
- Budget: {lead_data.get('budget', 'Unknown')}
- Temperature: {lead_data.get('temperature', 'Unknown')}

Additional Context: {context or 'None'}

Return a JSON object with:
- modified_script: the personalized script text
- changes_made: list of changes made
- language: language of the modified script

Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def get_embedding(self, text):
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.embed_model,
                    "prompt": text
                },
                timeout=60,
            )
            return response.json().get('embedding')
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    def find_relevant_knowledge(self, query_embedding, knowledge_base_items, top_k=3):
        import numpy as np

        results = []
        for item in knowledge_base_items:
            if item.embedding:
                try:
                    emb = item.embedding if isinstance(item.embedding, list) else json.loads(item.embedding)
                    sim = float(
                        np.dot(query_embedding, emb)
                        / (np.linalg.norm(query_embedding) * np.linalg.norm(emb))
                    )
                    results.append((item, sim))
                except Exception:
                    continue

        results.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in results[:top_k]]
