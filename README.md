# 🩺 A Multi-Modal AI Framework for Early Disease Detection

An advanced, AI-powered healthcare diagnostic tool designed for early disease detection through multi-modal symptom analysis and medical image classification. Combining natural language processing (NLP) and deep learning, this system delivers confident, explainable predictions to bridge the gap between clinical insights and accessible healthcare.

---

## 🚀 Live Demo
* **Frontend (Vercel):** https://medai-project-seven.vercel.app
* **Backend API (Render):** https://medai-project-iku3.onrender.com

---

## ✨ Features
* **Multi-Modal Diagnostics:** Integrates text-based symptom inputs with medical image classification.
* **AI-Powered Analysis:** Leverages cutting-edge LLMs and deep learning models for accurate health risk evaluation.
* **Explainable Predictions:** Provides clear insights behind diagnostic recommendations.
* **Secure Authentication:** User signup and login system protected with JWT and secure password hashing.
* **Responsive UI:** Modern, clean, and user-friendly web interface built with React.

---

## 🛠️ Tech Stack

### **Frontend**
* React.js
* Tailwind CSS / Custom CSS
* Lucide Icons

### **Backend**
* Python & FastAPI
* Pydantic (Data validation)
* Motor & PyMongo (Async MongoDB driver)
* Uvicorn (ASGI Server)

### **Database & Deployment**
* MongoDB Atlas (Cloud Database)
* Render (Backend Hosting)
* Vercel (Frontend Hosting)

---

## ⚙️ Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/tanmayshresht/medai-project.git
cd medai-project
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment:
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside the `backend` folder with the following variables:
```
MONGO_URL=your_mongodb_atlas_connection_string
DB_NAME=multimodal_health
EMERGENT_LLM_KEY=your_api_key_here
PORT=8001
```

Run the FastAPI server locally:
```bash
uvicorn server:app --reload --port 8001
```

### 3. Frontend Setup
Open a new terminal tab and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder:
```
REACT_APP_API_URL=http://localhost:8001
```

Start the React development server:
```bash
npm start
```

## 📄 Project Structure
```
medai-project/
│
├── backend/               # FastAPI Backend Server
│   ├── server.py          # Main application entry point
│   └── requirements.txt   # Python dependencies
│
└── frontend/              # React Frontend Application
    ├── src/               # Components, pages, and assets
    └── package.json       # Node dependencies
```

## 👨‍💻 Author

* Tanmay Shresht