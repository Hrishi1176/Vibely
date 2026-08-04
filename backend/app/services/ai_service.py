import os
import logging
from groq import Groq
from app.core.config import settings

logger = logging.getLogger("vibely.ai")

class AiService:
    def get_client(self):
        api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY") or os.environ.get("GROQ_API_KEY")
        if api_key and api_key.strip():
            return Groq(api_key=api_key.strip())
        return None

    def generate_caption(self, prompt: str, vibe: str = "energetic") -> dict:
        client = self.get_client()
        if not client:
            return {
                "caption": f"✨ {prompt} - living life with maximum {vibe} vibes!",
                "vibe_tag": f"#{vibe.title()}Vibes",
                "emojis": "🚀🔥✨"
            }
        
        try:
            sys_prompt = f"You are Vibely AI, a modern social media caption generator. Write an engaging post caption with a {vibe} tone based on the user's prompt. Keep it concise, fun, and add 2-3 matching hashtags and emojis. Respond in JSON format: {{\"caption\": \"...\", \"vibe_tag\": \"#...\", \"emojis\": \"...\"}}"
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=250,
            )
            content = response.choices[0].message.content
            return {
                "caption": content,
                "vibe_tag": f"#{vibe.title()}Vibes",
                "emojis": "⚡✨"
            }
        except Exception as e:
            logger.error(f"Groq API Error: {e}")
            return {
                "caption": f"{prompt} | Vibing with {vibe} energy!",
                "vibe_tag": "#VibelyLife",
                "emojis": "🌟💫"
            }

    def moderate_content(self, text: str) -> dict:
        banned_words = ["hate", "abuse", "scam", "illegal", "exploit"]
        lowered = text.lower()
        for word in banned_words:
            if word in lowered:
                return {"is_safe": False, "reason": f"Content contains restricted word: '{word}'"}
        
        client = self.get_client()
        if client:
            try:
                response = client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a content safety filter. Respond ONLY 'SAFE' if the text is suitable for a general audience social media app, or 'UNSAFE: reason' if it violates safety standards."},
                        {"role": "user", "content": text}
                    ],
                    temperature=0.1,
                    max_tokens=30,
                )
                res = response.choices[0].message.content.strip()
                if res.startswith("UNSAFE"):
                    return {"is_safe": False, "reason": res}
            except Exception as e:
                logger.error(f"Groq moderation check failed: {e}")

        return {"is_safe": True, "reason": "Content is safe and clear."}

    def chat_assistant(self, message: str) -> str:
        client = self.get_client()
        if not client:
            return settings.AI_FALLBACK_TEMPLATE.format(message=message)
        
        try:
            sys_prompt = "You are VibeAI, the friendly and witty AI companion built directly into Vibely social platform. Help users write posts, answer questions, and stay inspired."
            response = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=400,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"VibeAI is taking a quick breather: {str(e)}"

    def generate_image(self, prompt: str, width: int = 1024, height: int = 1024) -> str:
        import random
        import urllib.parse
        seed = random.randint(1000, 999999)
        encoded_prompt = urllib.parse.quote(prompt.strip())
        image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&seed={seed}&nologo=true"
        return image_url
