import requests
import json
from flask import current_app

SYSTEM_CONTEXT = """You are a sales AI assistant for a Vietnamese bamboo house company.
IMPORTANT RULES:
- Vietnamese currency: "1 tỷ" = 1,000,000,000 VND (1 billion VND ≈ $40,000 USD). NEVER say "trillion".
- "triệu" = million. "500 triệu" = 500,000,000 VND ≈ $20,000 USD.
- Always reply in the SAME LANGUAGE the customer used.
- If customer writes Vietnamese, reply in Vietnamese.
- If customer writes English, reply in English.
- Be professional, friendly, and helpful.
- Timezone: Vietnam (UTC+7).
"""


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
        prompt = f"""{SYSTEM_CONTEXT}

Analyze the following sales lead message and return a JSON object with:
- language: detected language (e.g. "English", "Vietnamese")
- intent: classification (inquiry, complaint, feedback, partnership, other)
- temperature: HOT, WARM, or COLD
- product_interest: extracted product interest or "None"
- budget: extracted budget in original currency (e.g. "1 tỷ VND", "500 triệu VND", "$20,000 USD"). Remember: "1 tỷ" = 1 billion VND ≈ $40,000 USD, NOT trillion.
- urgency: HIGH, MEDIUM, or LOW
- summary: brief summary in the detected language (1-2 sentences)
- suggested_reply: a professional reply in the SAME language the customer used. If Vietnamese, reply in Vietnamese.
- next_action: recommended next step for sales team

Lead message: "{lead_content}"

Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def suggest_follow_up(self, lead_data, conversation_history=""):
        prompt = f"""{SYSTEM_CONTEXT}

Based on the lead info and conversation history, suggest a follow-up message.
IMPORTANT: Reply in the SAME language as the conversation.

Lead Info:
- Name: {lead_data.get('name', 'Unknown')}
- Status: {lead_data.get('status', 'Unknown')}
- Temperature: {lead_data.get('temperature', 'Unknown')}
- Product Interest: {lead_data.get('product_interest', 'Unknown')}
- Budget: {lead_data.get('budget', 'Unknown')}
- Language: {lead_data.get('language', 'Unknown')}

Conversation History:
{conversation_history or 'No previous conversation'}

Return a JSON object with:
- follow_up_message: the suggested follow-up message (in the customer's language)
- next_action: recommended action (call, email, whatsapp, demo, quote, close)
- urgency: HIGH, MEDIUM, LOW
- reason: why this follow-up is recommended

Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def modify_script(self, script_content, lead_data, context=""):
        prompt = f"""{SYSTEM_CONTEXT}

Modify this sales script for the specific lead. Keep core message but adapt tone and language.

Original Script:
{script_content}

Lead Info:
- Name: {lead_data.get('name', 'Customer')}
- Country: {lead_data.get('country', 'Unknown')}
- Language: {lead_data.get('language', 'English')}
- Product Interest: {lead_data.get('product_interest', 'Unknown')}
- Budget: {lead_data.get('budget', 'Unknown')}
- Temperature: {lead_data.get('temperature', 'Unknown')}

Context: {context or 'None'}

Return JSON with: modified_script, changes_made, language.
Return ONLY valid JSON."""
        return self._call_ollama(prompt)

    def get_embedding(self, text):
        try:
            response = requests.post(
                f"{self.base_url}/api/embeddings",
                json={"model": self.embed_model, "prompt": text},
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
                    sim = float(np.dot(query_embedding, emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(emb)))
                    results.append((item, sim))
                except Exception:
                    continue
        results.sort(key=lambda x: x[1], reverse=True)
        return [r[0] for r in results[:top_k]]
