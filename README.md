# 🚀 Workly - Your Career, Simplified

<div align="center">

![Workly Logo](https://img.shields.io/badge/Workly-Career_Simplified-blue?style=for-the-badge)

**An AI-powered job matching platform that simplifies your career search**

[Live Demo](https://lovable.dev/projects/3292874d-5625-4329-9faf-7d7379803165) | [Documentation](#documentation) | [Local Setup](#-local-development)

</div>

---

## 📋 Overview

Workly is an intelligent job matching platform that leverages AI to help job seekers find their perfect career fit. The platform features:

- 🤖 **AI-Powered Chat** - Conversational interface to discuss career goals and get personalized recommendations
- 🗺️ **Interactive Map** - Visual representation of job opportunities with match percentages and salary information
- 📄 **CV Analysis** - Intelligent CV parsing and matching against job opportunities
- 🎯 **Smart Matching** - AI-driven job matching based on skills, experience, and preferences
- 🔊 **Voice Interaction** - Speech-to-text and text-to-speech capabilities for accessibility

---

## 🏗️ Project Structure

```
workly/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn-ui components
│   │   ├── ChatMessage.tsx # Chat interface component
│   │   ├── CVViewer.tsx    # CV display component
│   │   ├── NavLink.tsx     # Navigation component
│   │   └── VoiceSelector.tsx # Voice selection interface
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── Chat.tsx        # AI chat interface
│   │   ├── Map.tsx         # Interactive job map
│   │   ├── JobDetails.tsx  # Job details view
│   │   └── NotFound.tsx    # 404 page
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── utils/              # Helper utilities
│   │   └── audioRecorder.ts # Audio recording utilities
│   └── integrations/       # External integrations
│       └── supabase/       # Backend client
├── supabase/
│   └── functions/          # Edge functions (serverless)
│       ├── chat/           # AI chat endpoint
│       ├── generate-cv/    # CV generation
│       ├── generate-matches/ # Job matching algorithm
│       ├── parse-cv/       # CV parsing
│       ├── speech-to-text/ # Voice transcription
│       └── text-to-speech/ # Voice synthesis
└── public/                 # Static assets
```

---

## 🛠️ Technologies

### **Frontend**
- ⚛️ **React 18** - UI framework
- 📘 **TypeScript** - Type safety
- ⚡ **Vite** - Build tool and dev server
- 🎨 **Tailwind CSS** - Utility-first styling
- 🧩 **shadcn-ui** - Beautiful component library
- 🗺️ **Mapbox GL** - Interactive maps
- 🔄 **TanStack Query** - Data fetching and caching
- 🚦 **React Router** - Client-side routing

### **Backend (Lovable Cloud)**
- 🔥 **Edge Functions** - Serverless API endpoints
- 💾 **Database** - PostgreSQL with real-time capabilities
- 🔐 **Authentication** - Built-in auth system
- 📦 **Storage** - File storage for CVs and documents

### **AI & Machine Learning**
- 🤖 **Google Gemini 2.0 Flash Exp** - Primary AI model used directly via Google Cloud API
  - Used in: chat, CV generation, CV parsing, job matching
  - Requires `GOOGLE_API_KEY`
- 🎙️ **Google Cloud Speech-to-Text** - Voice transcription
  - Requires `GOOGLE_SPEECH_API_KEY`
- 🔊 **Google Cloud Text-to-Speech** - Voice synthesis
  - Requires `GOOGLE_TTS_API_KEY`
- 🎙️ **ElevenLabs** - Alternative text-to-speech provider
  - Models: `eleven_turbo_v2_5`, `eleven_multilingual_v2`
  - Voices: Aria, Roger, Sarah, and more
  - Requires `ELEVENLABS_API_KEY`

### **Deployment**
- 🌐 **Lovable Platform** - Automated deployment and hosting
- 🔄 **GitHub Integration** - Version control and CI/CD

---

## 🌐 Deployment

### **Live Application**
The application is deployed and accessible at:
- **Staging URL**: `https://[your-project].lovable.app`
- **Project Dashboard**: [Lovable Project](https://lovable.dev/projects/3292874d-5625-4329-9faf-7d7379803165)

### **Deployment Process**
1. Click the **Publish** button in the top right (desktop) or bottom right (mobile preview)
2. Frontend changes require clicking **Update** in the publish dialog
3. Backend changes (edge functions, database) deploy automatically

---

## 💻 Local Development

### **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn
- Git

### **Installation**

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd workly
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Lovable Cloud Configuration
VITE_SUPABASE_URL=https://ceqfrgifrdxtbryjosmm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcWZyZ2lmcmR4dGJyeWpvc21tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDEyMTAsImV4cCI6MjA3ODc3NzIxMH0.MMgThFaso9_1yh4n9YjmDqyHAMRTtnPAFv8jkngYZVE
VITE_SUPABASE_PROJECT_ID=ceqfrgifrdxtbryjosmm

# Optional: Only needed if running edge functions locally
# These are automatically configured as Lovable Cloud secrets in production
# GOOGLE_API_KEY=your_google_api_key_here
# GOOGLE_SPEECH_API_KEY=your_google_speech_key_here
# GOOGLE_TTS_API_KEY=your_google_tts_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_key_here
# MAPBOX_PUBLIC_TOKEN=your_mapbox_token_here
```

4. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
```
http://localhost:8080
```

---

## 🔑 API Keys & Secrets

The application uses the following services that require API keys:

### **Google Cloud APIs** (Required)
The project uses Google Cloud services directly:
- **Google Gemini API** - For AI chat, CV generation, parsing, and job matching
  - Sign up at [Google AI Studio](https://makersuite.google.com/)
  - Create an API key and add as `GOOGLE_API_KEY` secret
- **Google Cloud Speech-to-Text** - For voice transcription
  - Enable at [Google Cloud Console](https://console.cloud.google.com/)
  - Create credentials and add as `GOOGLE_SPEECH_API_KEY` secret
- **Google Cloud Text-to-Speech** - For voice synthesis
  - Enable at [Google Cloud Console](https://console.cloud.google.com/)
  - Create credentials and add as `GOOGLE_TTS_API_KEY` secret

### **ElevenLabs** (Required for alternative voice features)
- Sign up at [ElevenLabs](https://elevenlabs.io/)
- Get your API key from the dashboard
- Add to Lovable Cloud secrets as `ELEVENLABS_API_KEY`

### **Mapbox** (Required for interactive maps)
- Sign up at [Mapbox](https://www.mapbox.com/)
- Create an access token
- Add to Lovable Cloud secrets as `MAPBOX_PUBLIC_TOKEN`

**Note:** These API keys are stored as Lovable Cloud secrets in production and only need to be added to `.env` for local development.

---

## 🎯 Key Features

### **1. AI Chat Interface**
Intelligent conversational interface that:
- Understands career goals and preferences
- Provides personalized job recommendations
- Supports voice input/output
- Real-time streaming responses

### **2. Interactive Job Map**
Visual job search with:
- Geographic distribution of opportunities
- Hover details showing match percentage, position, salary
- Clustering for multiple opportunities in same location
- Click-through to detailed job information

### **3. CV Analysis**
Smart CV processing that:
- Parses uploaded CVs (PDF support)
- Extracts skills, experience, education
- Generates match scores against job openings
- Creates optimized CV versions

### **4. Voice Interaction**
Accessibility-first voice features:
- Speech-to-text for hands-free interaction
- Text-to-speech for audio responses
- Multiple voice options
- Multi-language support

---

## 🧪 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 🤝 Contributing

This project uses GitHub for version control. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is part of the Lovable platform ecosystem.

---

## 🆘 Support

For issues and questions:
- 📧 Lovable Support: [support@lovable.dev](mailto:support@lovable.dev)
- 📚 Documentation: [docs.lovable.dev](https://docs.lovable.dev)
- 💬 Discord: [Lovable Community](https://discord.com/channels/1119885301872070706)

---

<div align="center">

**Built with ❤️ using [Lovable](https://lovable.dev)**

</div>
