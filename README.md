# NextDraft - AI-Powered Resume Optimizer Backend

NextDraft is an AI-powered resume optimization platform that helps users enhance their resumes based on job descriptions using Google Gemini AI. Built with the MERN stack, it provides intelligent suggestions to improve resume content, keyword optimization, and ATS compatibility.

## 🔗 Links

- **Frontend**: [https://next-draft-dun.vercel.app/](https://next-draft-dun.vercel.app/)
- **Backend API**: [https://next-draft.onrender.com](https://next-draft.onrender.com)
- **Repository**: [https://github.com/bobbyy16/next-draft](https://github.com/bobbyy16/next-draft)
- **Demo**: [Watch Demo Video on Loom](https://www.loom.com/share/99479d7c172643309bb0ca9002058f7c)

## ✨ Features

- 🔐 **User Authentication** - Secure JWT-based authentication
- 📄 **Resume Upload & Parsing** - Support for PDF and DOCX files
- 💼 **Job Description Management** - Store and manage job descriptions
- 🤖 **AI-Powered Suggestions** - Google Gemini AI integration for intelligent resume optimization
- 📊 **Dashboard Analytics** - Comprehensive insights and statistics
- ☁️ **Cloud Storage** - Cloudinary integration for file management
- 🔍 **ATS Optimization** - Improve applicant tracking system compatibility

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Gemini AI
- **File Storage**: Cloudinary
- **Authentication**: JWT (JSON Web Tokens)
- **File Processing**: PDF-parse, Mammoth
- **Security**: Bcrypt, Helmet, CORS

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v18 or higher)
- MongoDB database
- Cloudinary account
- Google Gemini AI API key

## 🚀 Installation & Setup

1. **Clone the repository**

```bash
git clone https://github.com/bobbyy16/next-draft.git
cd next-draft
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Variables**
   Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

4. **Start the application**

```bash
# Development
npm run dev

# Production
npm start
```

### Authentication

All protected routes require JWT token in headers:

```
Authorization: Bearer <your_jwt_token>
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt encryption for passwords
- **Helmet** - Security headers middleware
- **CORS** - Cross-origin resource sharing configuration
- **File Validation** - File type and size restrictions
- **Route Protection** - Middleware-based route protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Bobby** - [@bobbyy16](https://github.com/bobbyy16)

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check existing [GitHub Issues](https://github.com/bobbyy16/next-draft/issues)
2. Create a new issue with detailed information
3. Include error messages, screenshots, and steps to reproduce

⭐ **Star this repository if you found it helpful!**
