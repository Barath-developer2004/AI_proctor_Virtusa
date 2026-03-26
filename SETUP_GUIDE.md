# Jatayu AI Proctor - Complete Setup & Feature Guide

## 📋 Table of Contents
1. [Tech Stack Overview](#tech-stack-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Docker)](#quick-start-docker)
4. [Manual Setup (Local Development)](#manual-setup-local-development)
5. [Step-by-Step Commands](#step-by-step-commands)
6. [Feature Documentation](#feature-documentation)
7. [Testing the Application](#testing-the-application)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Tech Stack Overview

### Backend (Go + Fiber)
- **Language**: Go 1.22+
- **Framework**: Fiber (web framework)
- **Database**: PostgreSQL (primary)
- **Cache**: Redis (session management)
- **AI Integration**: Google Gemini API
- **Real-time**: WebSocket for telemetry
- **Authentication**: JWT tokens

### Frontend (Next.js)
- **Framework**: Next.js 14+ with TypeScript
- **UI**: TailwindCSS for styling
- **Editor**: Monaco Editor (VS Code editor)
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: WebSocket client

### Chrome Extension
- **Purpose**: Proctoring and telemetry
- **Features**: Tab monitoring, keystroke tracking, clipboard detection
- **Target**: `http://localhost:3000/*`

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL with JSONB support
- **Caching**: Redis for session data
- **API**: RESTful APIs + WebSocket

---

## 📋 Prerequisites

### Required Software
- **Node.js**: 20+ 
- **Go**: 1.22+
- **Docker Desktop**: (recommended) for PostgreSQL + Redis
- **Chrome**: (for extension testing)
- **Git**: for version control

### Required APIs/Keys
- **Gemini API Key**: For AI assessment features
- **JWT Secret**: For authentication (auto-generated for local)

---

## 🚀 Quick Start (Docker - Recommended)

From the repository root:

```bash
# Set environment variables
export GEMINI_API_KEY="your_gemini_api_key_here"

# Start everything with Docker Compose
docker compose up --build
```

**Access URLs:**
- Frontend: `http://localhost:3000`
- Backend Health: `http://localhost:8080/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 💻 Manual Setup (Local Development)

### 1. Start Dependencies (PostgreSQL + Redis)

```bash
# Option A: Docker for dependencies only
docker compose up postgres redis

# Option B: Install locally and configure .env files
# See .env.example files for configuration
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
go mod tidy

# Set environment variables (create .env file)
echo "DATABASE_URL=postgres://postgres:postgres@localhost:5432/jatayu_proctor?sslmode=disable" > .env
echo "REDIS_URL=redis://localhost:6379" >> .env
echo "JWT_SECRET=your-secret-key-here" >> .env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> .env

# Run the server
go run ./cmd/server
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Run development server
npm run dev
```

---

## 📝 Step-by-Step Commands

### Complete Setup Sequence

```bash
# 1. Clone and navigate to project
git clone <repository-url>
cd jatayu-ai-proctor

# 2. Set up environment variables
export GEMINI_API_KEY="your_gemini_api_key_here"

# 3. Start with Docker (easiest)
docker compose up --build

# ALTERNATIVE: Manual setup
# 3a. Start dependencies
docker compose up postgres redis -d

# 3b. Setup backend
cd backend
go mod tidy
go run ./cmd/server &
cd ..

# 3c. Setup frontend
cd frontend
npm install
npm run dev &
cd ..

# 4. Setup Chrome Extension
# Open Chrome → chrome://extensions
# Enable Developer mode
# Click "Load unpacked" → select "extension/" folder
```

### Development Commands

```bash
# Backend Development
cd backend
go run ./cmd/server          # Start server
go test ./...                # Run tests
go mod tidy                  # Clean dependencies

# Frontend Development
cd frontend
npm run dev                  # Start dev server
npm run build                # Build for production
npm run start                # Start production server
npm run lint                 # Run linter

# Docker Commands
docker compose up --build     # Build and start all services
docker compose down           # Stop all services
docker compose logs -f        # View logs
```

---

## 🌟 Feature Documentation

### 1. **Multiple Choice Questions (MCQ) System**
**Purpose**: Knowledge assessment before coding phase

**Implementation**:
- **Backend**: JSONB storage in `exams.mcqs` and `sessions.mcq_answers`
- **Frontend**: Dynamic MCQ builder in admin panel, MCQ view for candidates
- **APIs**: 
  - `POST /api/sessions/:id/submit-mcqs` - Submit MCQ answers
  - `GET /api/admin/exams/:id` - Get exam with MCQs

**Flow**:
1. Admin creates exam with MCQs using dynamic builder
2. Candidate starts session → MCQ phase first
3. Candidate answers all MCQs → automatic scoring
4. Transition to coding phase

### 2. **Multi-Language Code Editor**
**Purpose**: Support multiple programming languages

**Supported Languages**:
- Python
- JavaScript  
- Java
- C++
- Go

**Implementation**:
- **Frontend**: Monaco Editor with language selector
- **Backend**: Language-agnostic code execution
- **APIs**: `POST /api/sessions/:id/submit-code` with language parameter

**Features**:
- Real-time syntax highlighting
- Language switching during coding phase
- Persistent language selection

### 3. **Assessment Pipeline**
**Phases**:
1. **MCQ** → Knowledge assessment
2. **CODING** → Problem solving with telemetry
3. **SOCRATIC** → AI-powered technical interview
4. **SABOTEUR** → Live debugging challenge
5. **COMPLETE** → Final results

**Telemetry Features**:
- Keystroke cadence analysis
- Tab switching detection
- Clipboard monitoring
- DevTools detection

### 4. **AI Integration**
**Gemini API Uses**:
- **Socratic Assessment**: Technical interview questions
- **Code Analysis**: Scoring and feedback
- **Natural Language Processing**: Understanding responses

### 5. **Admin Dashboard**
**Features**:
- Live session monitoring
- Exam creation with MCQ builder
- Candidate management
- Result reporting with PDF downloads
- Violation tracking

### 6. **Proctoring System**
**Chrome Extension Features**:
- Real-time keystroke tracking
- Tab switching detection
- Clipboard monitoring
- DevTools opening detection
- WebSocket telemetry streaming

---

## 🧪 Testing the Application

### 1. **Admin Workflow**
```bash
1. Register admin: http://localhost:3000/register (role: admin)
2. Login: http://localhost:3000/login
3. Go to admin panel: http://localhost:3000/admin
4. Create exam:
   - Add title, description, language
   - Add MCQs using "+ Add MCQ" button
   - Write coding prompt
   - Set time limit
5. Monitor sessions in "Live Monitor" tab
```

### 2. **Candidate Workflow**
```bash
1. Register candidate: http://localhost:3000/register
2. Login: http://localhost:3000/login
3. Go to dashboard: http://localhost:3000/dashboard
4. Start exam session
5. Complete MCQ phase
6. Write code in chosen language
7. Complete Socratic AI interview
8. Fix code in Saboteur phase
9. View final results
```

### 3. **Extension Testing**
```bash
1. Load Chrome extension from "extension/" folder
2. Start coding phase
3. Test violations:
   - Switch tabs → should increment violations
   - Open DevTools → should increment violations  
   - Copy/paste → should increment violations
   - Type → should stream keystrokes via WebSocket
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Backend won't start**
```bash
# Check PostgreSQL connection
docker compose logs postgres

# Check Redis connection  
docker compose logs redis

# Verify environment variables
cat backend/.env
```

**2. Frontend API errors**
```bash
# Check backend health
curl http://localhost:8080/health

# Verify API URL in frontend
cat frontend/.env.local

# Check CORS settings
curl -H "Origin: http://localhost:3000" http://localhost:8080/api/exams
```

**3. Extension not working**
```bash
# Verify extension is enabled
chrome://extensions/

# Check console for errors
F12 → Console tab on exam page

# Verify WebSocket connection
Network tab → WS connections
```

**4. AI features not working**
```bash
# Check Gemini API key
echo $GEMINI_API_KEY

# Test API connectivity
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

### Port Conflicts
Default ports:
- Frontend: 3000
- Backend: 8080  
- PostgreSQL: 5432
- Redis: 6379

If ports are occupied:
```bash
# Kill processes using ports
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

# Or change ports in docker-compose.yml
```

---

## 📊 Performance Considerations

### Database Optimization
- JSONB columns for MCQ data provide efficient querying
- Indexes on session foreign keys
- Connection pooling via pgxpool

### Frontend Optimization  
- Monaco Editor lazy loading
- WebSocket connection management
- State management with Zustand

### Scaling Considerations
- Redis for session caching
- WebSocket load balancing
- Database connection pooling

---

## 🔒 Security Features

### Authentication
- JWT-based authentication
- Role-based access control (admin/candidate)
- Secure token storage

### Proctoring
- Real-time telemetry monitoring
- Violation detection and logging
- Secure exam environment

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

---

## 📈 Monitoring & Analytics

### Session Tracking
- Real-time phase monitoring
- Violation counting
- Performance metrics

### Reporting
- PDF generation for results
- Admin dashboard analytics
- Session history tracking

---

**🎉 Your Jatayu AI Proctor is now ready with complete MCQ and Multi-Language support!**

For any issues or questions, refer to the troubleshooting section or check the logs in the Docker containers.
