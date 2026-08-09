from fastapi import FastAPI, HTTPException, Depends, status, Request, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
import os
import jwt
import bcrypt
import datetime
import uuid
import base64
import requests
import re
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "multimodal_health")
JWT_SECRET = os.getenv("JWT_SECRET", "medai_super_secret_jwt_key_2026")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

app = FastAPI(title="MedAI Multi-Modal Disease Detection API", version="1.0.0")

# CORS middleware configuration
# NOTE: allow_origins=["*"] combined with allow_credentials=True is invalid per the
# CORS spec (browsers reject it). List the actual frontend origin(s) explicitly instead.
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ----------------- JWT & AUTH HELPERS -----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")

def _extract_token(request: Request) -> Optional[str]:
    """
    Reads the token from either the httpOnly cookie or the Authorization header.
    Uses request.cookies directly (instead of a FastAPI Cookie() parameter) so this
    works identically whether called as a Depends() or invoked manually inside a
    route body -- FastAPI's Cookie() injection only fires through the dependency
    system, so a manual call like `get_current_user(request)` would otherwise
    silently see access_token=None even when the cookie is present.
    """
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    return token

async def get_current_user(request: Request):
    token = _extract_token(request)

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

async def get_current_user_optional(request: Request):
    """Same as get_current_user but returns None instead of raising when unauthenticated."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ----------------- PYDANTIC SCHEMAS -----------------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PredictRequest(BaseModel):
    age: int
    gender: str
    symptoms: str
    image_base64: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str

# ----------------- API ENDPOINTS -----------------

@app.get("/api/")
async def root():
    return {"status": "ok", "service": "MedAI Multi-Modal Disease Detection"}

@app.post("/api/auth/register")
async def register(user_data: UserRegister, response: Response):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)

    new_user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_pw,
        "created_at": datetime.datetime.utcnow()
    }
    await db.users.insert_one(new_user)

    token = create_access_token({"sub": user_id})
    response.set_cookie(key="access_token", value=token, httponly=True, max_age=604800, samesite="lax")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "name": user_data.name, "email": user_data.email}
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": user["id"]})
    response.set_cookie(key="access_token", value=token, httponly=True, max_age=604800, samesite="lax")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
    }

@app.get("/api/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "name": current_user["name"], "email": current_user["email"]}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"ok": True}

# ----------------- RULE-BASED PREDICTION ENGINE (100% free, no API calls) -----------------

CONDITION_PROFILES = [
    {
        "keywords": ["chest pain", "chest tightness", "shortness of breath", "palpitation", "heart"],
        "predicted_disease": "Possible Cardiac or Cardiopulmonary Concern",
        "alternative_conditions": ["Anxiety-related chest tightness", "Musculoskeletal chest pain", "Acid reflux (GERD)"],
        "confidence_percent": 58.0,
        "risk_level": "High",
        "symptom_analysis_template": "Chest-related symptoms can stem from cardiac, respiratory, muscular, or digestive causes. Given the potential seriousness of chest symptoms, prompt medical evaluation is strongly advised rather than self-diagnosis.",
        "recommendations": [
            "Seek prompt medical evaluation — same-day if pain is severe, new, or worsening.",
            "Note if pain radiates to arm, jaw, or back, and if it worsens with exertion.",
            "Avoid strenuous activity until evaluated.",
            "Track blood pressure and heart rate if a monitor is available.",
            "Get an ECG and basic cardiac work-up if advised by a doctor.",
            "Do not ignore recurring or worsening chest discomfort.",
        ],
        "red_flags": [
            "Crushing or radiating chest pain with sweating",
            "Shortness of breath at rest",
            "Pain spreading to jaw, neck, or left arm",
            "Fainting or severe dizziness",
            "Irregular or racing heartbeat",
        ],
    },
    {
        "keywords": ["joint", "arthritis", "stiffness", "swelling", "deformity", "muscle weakness"],
        "predicted_disease": "Possible Inflammatory or Degenerative Joint Condition",
        "alternative_conditions": ["Osteoarthritis", "Rheumatoid arthritis", "Soft tissue injury"],
        "confidence_percent": 55.0,
        "risk_level": "Moderate",
        "symptom_analysis_template": "Joint-related symptoms (stiffness, swelling, deformity, or weakness) can arise from degenerative wear, inflammatory autoimmune conditions, or injury. Pattern (which joints, symmetry, morning stiffness duration) matters for narrowing the cause.",
        "recommendations": [
            "Consult a doctor or rheumatologist for joint pain lasting more than a few weeks.",
            "Note which joints are affected and whether symptoms are symmetric.",
            "Track morning stiffness duration — over 30-60 minutes suggests inflammatory causes.",
            "Consider blood tests (RF, anti-CCP, ESR/CRP) if inflammatory arthritis is suspected.",
            "Use supportive measures: rest, gentle movement, joint protection.",
            "Avoid activities that worsen pain until evaluated.",
        ],
        "red_flags": [
            "Sudden severe swelling with fever (possible joint infection)",
            "Inability to bear weight or move the joint",
            "Numbness or loss of sensation nearby",
            "Rapidly worsening deformity",
            "Signs of infection: redness, warmth, fever",
        ],
    },
    {
        "keywords": ["cough", "cold", "sore throat", "runny nose", "sneezing", "congestion"],
        "predicted_disease": "Upper Respiratory Tract Infection (Common Cold/Flu-like illness)",
        "alternative_conditions": ["Seasonal allergies", "Sinusitis", "Mild viral bronchitis"],
        "confidence_percent": 70.0,
        "risk_level": "Low",
        "symptom_analysis_template": "These symptoms are commonly associated with a viral upper respiratory infection, which is usually self-limiting within 7-10 days.",
        "recommendations": [
            "Rest and stay well hydrated.",
            "Use warm fluids or steam inhalation for congestion relief.",
            "Monitor temperature; use fever reducers if needed and appropriate.",
            "Avoid close contact with others to prevent spreading illness.",
            "See a doctor if symptoms persist beyond 10 days or worsen.",
            "Consider a COVID/flu test if symptoms are significant.",
        ],
        "red_flags": [
            "Difficulty breathing or persistent shortness of breath",
            "High fever above 103°F unresponsive to medication",
            "Chest pain or pressure",
            "Confusion or severe lethargy",
            "Symptoms lasting beyond 2-3 weeks without improvement",
        ],
    },
    {
        "keywords": ["stomach", "abdominal", "nausea", "vomiting", "diarrhea", "constipation"],
        "predicted_disease": "Possible Gastrointestinal Upset",
        "alternative_conditions": ["Gastroenteritis", "Food intolerance", "Irritable bowel syndrome"],
        "confidence_percent": 60.0,
        "risk_level": "Low",
        "symptom_analysis_template": "Gastrointestinal symptoms are often caused by dietary factors, mild infection, or stress, though persistent or severe symptoms warrant evaluation.",
        "recommendations": [
            "Stay hydrated, especially with vomiting or diarrhea.",
            "Eat bland, easy-to-digest foods (rice, bananas, toast).",
            "Avoid dairy, caffeine, and spicy/fatty foods temporarily.",
            "Track symptom duration and any triggers (specific foods).",
            "See a doctor if symptoms last more than 2-3 days.",
            "Seek care sooner if there's blood, severe pain, or high fever.",
        ],
        "red_flags": [
            "Blood in vomit or stool",
            "Severe, unrelenting abdominal pain",
            "Signs of dehydration (dizziness, very dark urine)",
            "High fever with abdominal pain",
            "Persistent vomiting preventing fluid intake",
        ],
    },
    {
        "keywords": ["headache", "migraine", "dizziness", "vision"],
        "predicted_disease": "Possible Tension Headache or Migraine",
        "alternative_conditions": ["Dehydration-related headache", "Sinus headache", "Eye strain"],
        "confidence_percent": 62.0,
        "risk_level": "Low",
        "symptom_analysis_template": "Headaches are frequently caused by stress, dehydration, poor sleep, or eye strain, though sudden severe headaches need urgent evaluation.",
        "recommendations": [
            "Rest in a quiet, dark room.",
            "Stay hydrated and maintain regular sleep.",
            "Limit screen time and take breaks to reduce eye strain.",
            "Track headache frequency and triggers (food, stress, sleep).",
            "Use appropriate over-the-counter relief if suitable for you.",
            "See a doctor if headaches are frequent, severe, or new in pattern.",
        ],
        "red_flags": [
            "Sudden 'worst headache of your life'",
            "Headache with fever and stiff neck",
            "Vision changes or slurred speech",
            "Headache after a head injury",
            "Weakness or numbness on one side of the body",
        ],
    },
    {
        "keywords": ["fatigue", "tired", "insomnia", "sleep", "weakness", "low energy"],
        "predicted_disease": "General Fatigue / Non-specific Symptom Complex",
        "alternative_conditions": ["Sleep disturbance", "Stress-related fatigue", "Nutritional deficiency"],
        "confidence_percent": 50.0,
        "risk_level": "Low",
        "symptom_analysis_template": "Fatigue and sleep issues can relate to lifestyle factors, stress, or underlying conditions. Persistent fatigue beyond 2 weeks is worth medical evaluation.",
        "recommendations": [
            "Maintain a consistent sleep schedule.",
            "Ensure balanced nutrition and adequate hydration.",
            "Incorporate light physical activity if tolerated.",
            "Reduce caffeine and screen exposure before bed.",
            "Track fatigue duration and any associated symptoms.",
            "See a doctor if fatigue persists beyond 2 weeks or worsens.",
        ],
        "red_flags": [
            "Fatigue with unexplained weight loss",
            "Fatigue with chest pain or breathlessness",
            "Fainting spells",
            "Fatigue with persistent fever",
            "Sudden severe weakness on one side of the body",
        ],
    },
    {
        "keywords": ["rash", "skin", "itching", "redness", "hives"],
        "predicted_disease": "Possible Dermatological Reaction",
        "alternative_conditions": ["Contact dermatitis", "Allergic reaction", "Eczema flare-up"],
        "confidence_percent": 58.0,
        "risk_level": "Low",
        "symptom_analysis_template": "Skin symptoms often result from irritants, allergies, or mild infections. Spreading or worsening rashes should be evaluated by a doctor.",
        "recommendations": [
            "Avoid scratching the affected area.",
            "Keep skin clean and moisturized.",
            "Identify and avoid potential triggers (new soap, food, fabric).",
            "Use a mild antihistamine if appropriate for itching.",
            "Monitor for spreading or worsening.",
            "See a doctor if the rash blisters, spreads rapidly, or comes with fever.",
        ],
        "red_flags": [
            "Rash with difficulty breathing or facial swelling (allergic emergency)",
            "Widespread blistering",
            "Rash with high fever",
            "Signs of skin infection: warmth, pus, spreading redness",
            "Rash following a new medication",
        ],
    },
]

DEFAULT_PROFILE = {
    "predicted_disease": "Non-specific Symptom Presentation",
    "alternative_conditions": ["Viral syndrome", "Stress-related symptoms", "Early-stage illness"],
    "confidence_percent": 45.0,
    "risk_level": "Low",
    "symptom_analysis_template": "The reported symptoms don't map clearly to a specific pattern from the information given. More detail (duration, severity, associated symptoms) would help narrow this down.",
    "recommendations": [
        "Track symptom onset, duration, and severity.",
        "Note any associated symptoms not yet mentioned.",
        "Stay hydrated and rest as needed.",
        "Monitor for any worsening or new symptoms.",
        "Consult a doctor if symptoms persist beyond a week.",
        "Seek prompt care if symptoms are severe or rapidly worsening.",
    ],
    "red_flags": [
        "Severe or rapidly worsening symptoms",
        "Difficulty breathing",
        "High fever unresponsive to medication",
        "Confusion or loss of consciousness",
        "Any symptom that feels like a medical emergency to you",
    ],
}

DISCLAIMER = (
    "This is a rule-based educational screening tool, not a real diagnostic AI model. "
    "It does not replace professional medical evaluation. Always consult a qualified "
    "healthcare provider for an accurate diagnosis."
)


def generate_rule_based_prediction(age: int, gender: str, symptoms: str) -> dict:
    text = symptoms.lower()

    best_profile = None
    best_score = 0
    for profile in CONDITION_PROFILES:
        score = sum(1 for kw in profile["keywords"] if kw in text)
        if score > best_score:
            best_score = score
            best_profile = profile

    profile = best_profile if best_profile else DEFAULT_PROFILE

    duration_match = re.search(r"(\d+)\s*(day|days|week|weeks|month|months)", text)
    duration_note = ""
    if duration_match:
        duration_note = f" Symptoms have reportedly persisted for {duration_match.group(0)}, which is relevant for determining urgency."

    symptom_analysis = (
        f"Patient (age {age}, {gender}) reports: \"{symptoms.strip()}\". "
        f"{profile['symptom_analysis_template']}{duration_note}"
    )

    return {
        "predicted_disease": profile["predicted_disease"],
        "alternative_conditions": profile["alternative_conditions"],
        "confidence_percent": profile["confidence_percent"],
        "risk_level": profile["risk_level"],
        "image_findings": "Image analysis is not available in the free/offline mode.",
        "symptom_analysis": symptom_analysis,
        "recommendations": profile["recommendations"],
        "red_flags": profile["red_flags"],
        "disclaimer": DISCLAIMER,
    }


# ----------------- REPLACEMENT /api/predict ENDPOINT (no external API calls) -----------------

@app.post("/api/predict")
async def predict_disease(
    payload: PredictRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    result_data = generate_rule_based_prediction(payload.age, payload.gender, payload.symptoms)

    prediction_id = str(uuid.uuid4())
    record = {
        "id": prediction_id,
        "user_id": current_user["id"] if current_user else None,
        "age": payload.age,
        "gender": payload.gender,
        "symptoms": payload.symptoms,
        "result": result_data,
        "created_at": datetime.datetime.utcnow()
    }

    persisted = False
    if current_user:
        await db.predictions.insert_one(record)
        persisted = True

    response_payload = result_data.copy()
    response_payload["prediction_id"] = prediction_id
    response_payload["persisted"] = persisted
    return response_payload

@app.get("/api/predictions")
async def get_predictions(q: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if q:
        query["$or"] = [
            {"symptoms": {"$regex": q, "$options": "i"}},
            {"result.predicted_disease": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.predictions.find(query).sort("created_at", -1)
    predictions = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        predictions.append(doc)
    return predictions

@app.delete("/api/predictions/{pred_id}")
async def delete_prediction(pred_id: str, current_user: dict = Depends(get_current_user)):
    res = await db.predictions.delete_one({"id": pred_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"ok": True}



RED_FLAG_KEYWORDS = {
    "chest pain": "Chest pain can sometimes signal a heart-related emergency, especially if it's severe, radiates to your arm/jaw, or comes with sweating or shortness of breath. If you have any of these, please seek emergency care immediately.",
    "difficulty breathing": "Difficulty breathing can be serious. If it's sudden, severe, or worsening, please seek emergency care immediately.",
    "shortness of breath": "Shortness of breath can be serious. If it's sudden, severe, or worsening, please seek emergency care immediately.",
    "fainting": "Fainting or loss of consciousness should be evaluated promptly by a medical professional, especially if it happened suddenly or more than once.",
    "blood in stool": "Blood in stool or vomit needs prompt medical evaluation — please consult a doctor as soon as possible.",
    "blood in vomit": "Blood in stool or vomit needs prompt medical evaluation — please consult a doctor as soon as possible.",
    "severe headache": "A sudden, severe headache (especially the 'worst headache of your life') can be a medical emergency — please seek immediate care if this applies to you.",
    "suicidal": "If you're having thoughts of harming yourself, please reach out to a mental health professional or a crisis helpline right away. You don't have to go through this alone.",
}

TOPIC_RESPONSES = {
    "fever": "Fever is often the body's response to infection. Track your temperature, stay hydrated, and rest. See a doctor if it exceeds 103°F (39.4°C), lasts more than 3 days, or comes with severe symptoms like a stiff neck, confusion, or difficulty breathing.",
    "headache": "Headaches are commonly caused by stress, dehydration, poor sleep, or eye strain. Try resting in a dark quiet room, hydrating, and avoiding screens. See a doctor if it's sudden and severe, or comes with vision changes, confusion, or a stiff neck.",
    "cough": "A cough lasting under 2-3 weeks is often from a cold, allergies, or mild infection. Stay hydrated and monitor for fever. See a doctor if it persists beyond 3 weeks, produces blood, or comes with chest pain or breathlessness.",
    "cold": "For common cold symptoms, rest, fluids, and over-the-counter symptom relief usually help. Most colds resolve in 7-10 days. See a doctor if symptoms worsen after a week or you develop a high fever.",
    "stomach": "Stomach discomfort can stem from diet, stress, or mild infection. Stay hydrated, eat bland foods, and monitor symptoms. See a doctor if pain is severe, persistent, or comes with vomiting blood or high fever.",
    "diarrhea": "For diarrhea, focus on hydration (water, oral rehydration solutions) and easy-to-digest foods. See a doctor if it lasts more than 2 days, or comes with high fever, severe pain, or blood.",
    "fatigue": "Ongoing fatigue can relate to sleep, stress, diet, or an underlying condition. Track how long it's lasted and any other symptoms. If it persists more than 2 weeks or is unusually severe, it's worth getting checked out.",
    "rash": "Skin rashes can come from allergies, irritation, or infection. Avoid scratching, keep the area clean, and note if it's spreading. See a doctor if it's widespread, painful, blistering, or comes with fever.",
    "how does this platform work": "MedAI lets you enter your age, gender, and symptoms (optionally with a medical image) to get an AI-generated preliminary health screening — including a possible condition, risk level, and recommendations. It's for educational awareness only, not a diagnosis.",
    "how does this work": "MedAI lets you enter your age, gender, and symptoms (optionally with a medical image) to get an AI-generated preliminary health screening — including a possible condition, risk level, and recommendations. It's for educational awareness only, not a diagnosis.",
}

GREETINGS = {"hi", "hello", "hey", "hii", "helo", "hola", "namaste"}


def generate_fallback_reply(message: str) -> str:
    """
    Lightweight keyword-based responder used when no LLM API key is configured.
    Not a replacement for a real model, but gives varied, relevant answers
    instead of one repeated generic message.
    """
    text = message.strip().lower()

    if not text:
        return "Could you tell me a bit more about what's going on?"

    # Pure greeting
    if text in GREETINGS or (len(text.split()) <= 2 and any(g in text for g in GREETINGS)):
        return (
            "Hi! I'm MedAI Assistant. Tell me about any symptoms you're noticing "
            "(what, how long, and how severe), and I'll share general guidance. "
            "For anything urgent, please contact a doctor or emergency services directly."
        )

    # Red-flag symptom check first — safety-critical, takes priority
    for keyword, warning in RED_FLAG_KEYWORDS.items():
        if keyword in text:
            return f"⚠️ {warning}\n\nThis is educational guidance only, not a diagnosis — please consult a medical professional for anything urgent."

    # Extract a duration mention if present (e.g. "2 weeks", "3 days")
    duration_match = re.search(r"(\d+)\s*(day|days|week|weeks|month|months)", text)
    duration_note = ""
    if duration_match:
        duration_note = f" Since this has been going on for {duration_match.group(0)}, it's a good idea to get it checked if it hasn't improved or is getting worse."

    # Topic-based matches
    matched_responses = []
    for keyword, response in TOPIC_RESPONSES.items():
        if keyword in text:
            matched_responses.append(response)

    if matched_responses:
        combined = " ".join(matched_responses[:2])
        return f"{combined}{duration_note}\n\nThis is general educational guidance only — for a personalized assessment, please use the Predict page or consult a doctor."

    # No keyword matched — general fallback that still references what they said
    return (
        f"Thanks for sharing that. Based on what you've described ('{message.strip()}'), "
        "I'd recommend noting when it started, how severe it is, and any other symptoms "
        "alongside it. For a structured AI screening, try the Predict page — or consult "
        "a doctor if it's causing you concern.{duration}"
    ).replace("{duration}", duration_note)


@app.post("/api/chat")
async def chat_assistant(payload: ChatRequest):
    if not EMERGENT_LLM_KEY:
        return {"reply": generate_fallback_reply(payload.message)}

    try:
        ai_resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {EMERGENT_LLM_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are MedAI Assistant, an expert medical AI chatbot answering health queries accurately and safely."
                    },
                    {"role": "user", "content": payload.message}
                ],
                "temperature": 0.3
            },
            timeout=20
        )
        if ai_resp.status_code == 200:
            reply = ai_resp.json()["choices"][0]["message"]["content"]
            return {"reply": reply}
        else:
            print("OpenAI Error Response:", ai_resp.text)
    except Exception as e:
        print("Exception caught in chat:", str(e))

    # If the API call failed for any reason, use the rule-based fallback
    # instead of a hardcoded message.
    return {"reply": generate_fallback_reply(payload.message)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)