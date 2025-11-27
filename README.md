# Friendzy - Real-Time Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO. Friendzy enables users to engage in seamless real-time messaging, create group channels, share files, and manage their profiles—all within a sleek, responsive interface.

## ✨ Key Highlights

- 🚀 **Production-Ready** - Fully deployable with secure authentication and data storage
- ⚡ **Real-Time** - Instant messaging powered by Socket.IO
- 📁 **GridFS Storage** - Efficient file and image management with MongoDB GridFS
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS and Radix UI
- 🔐 **Secure** - JWT authentication, bcrypt password hashing, and CORS protection

## 📸 Screenshots

### Login Page
![Login Page](./Screenshot/login.jpg)

### Profile Creation
![Profile Creation](./Screenshot/profile_creation.jpg)

### Main Page
![Main Page](./Screenshot/Main_page.jpg)

### Contact Details
![Contact Details](./Screenshot/contact_details.jpg)

### Channel Management
![Channel Interface](./Screenshot/channel.jpg)

### Chat Interface
<div align="center">
  <img src="./Screenshot/chat1.jpg" alt="Chat Interface 1" width="45%">
  <img src="./Screenshot/chat2.jpg" alt="Chat Interface 2" width="45%">
</div>
<div align="center">
  <img src="./Screenshot/chat3.jpg" alt="Chat Interface 3" width="45%">
  <img src="./Screenshot/chat4.jpg" alt="Chat Interface 4" width="45%">
</div>
<div align="center">
  <img src="./Screenshot/chat5.jpg" alt="Chat Interface 5" width="45%">
</div>

## 🚀 Features

### Core Functionality
- ⚡ **Real-time messaging** with Socket.IO - Instant message delivery
- 🔐 **Secure authentication** - JWT-based user authentication with HTTP-only cookies
- 💬 **Direct messaging** - Private one-on-one conversations
- 📢 **Channel system** - Create and manage group channels
- 👥 **Channel administration** - Admin controls for channel management (add/remove members, edit details)
- 📎 **File sharing** - Upload and share images and documents
- 🖼️ **Profile & Channel Images** - Custom avatars and channel icons stored in GridFS
- 📜 **Message persistence** - Complete message history stored in MongoDB
- 🟢 **Online status** - Real-time user presence indicators
- 🔍 **Contact search** - Find and connect with other users
- 👤 **Member management** - Add or remove members from channels (Admin only)

### User Experience
- 📱 **Fully responsive** - Optimized for mobile, tablet, and desktop
- 🎨 **Modern dark theme** - Eye-friendly dark mode interface
- ✨ **Smooth animations** - Lottie animations for enhanced UX
- 🎯 **Intuitive UI** - Clean and user-friendly design
- ⚡ **Fast performance** - Optimized build with Vite

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI framework with latest features
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled component primitives
- **Socket.IO Client** - Real-time bidirectional communication
- **Axios** - Promise-based HTTP client
- **Zustand** - Lightweight state management
- **React Router v6** - Declarative routing for React
- **Lottie React** - High-quality animations
- **Emoji Picker React** - Emoji support in messages
- **Moment.js** - Date and time formatting

### Backend
- **Node.js (v18+)** - JavaScript runtime environment
- **Express.js** - Minimal and flexible web framework
- **Socket.IO** - Real-time event-based communication
- **MongoDB** - NoSQL document database
- **Mongoose** - Elegant MongoDB object modeling
- **GridFS** - File storage system for MongoDB
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing and security
- **Multer** - Multipart/form-data file upload handling
- **CORS** - Cross-Origin Resource Sharing middleware
- **Cookie-Parser** - Parse HTTP cookies
- **Dotenv** - Environment variable management

## 📁 Project Structure

```
Chat Application/
├── React_node_chat_app/          # Frontend React application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   └── ui/              # Radix UI components
│   │   ├── pages/               # Application pages
│   │   │   ├── auth/            # Authentication (Login, Signup)
│   │   │   ├── chat/            # Chat interface components
│   │   │   │   ├── components/
│   │   │   │   │   ├── chat-container/
│   │   │   │   │   ├── contact-container/
│   │   │   │   │   ├── empty-chat-container/
│   │   │   │   │   └── channel-details/
│   │   │   └── profile/         # User profile management
│   │   ├── store/               # Zustand state management
│   │   ├── lib/                 # Utility functions and helpers
│   │   ├── context/             # React Context providers
│   │   ├── utils/               # Constants and helper functions
│   │   └── assets/              # Static assets (images, animations)
│   ├── public/                  # Public static files
│   ├── .env                     # Environment variables
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                       # Backend Node.js application
│   ├── controllers/             # Route controllers
│   │   ├── AuthController.js    # Authentication logic
│   │   ├── MessageController.js # Message handling
│   │   ├── ContactController.js # Contact management
│   │   └── ChannelController.js # Channel operations
│   ├── models/                  # Mongoose schemas
│   │   ├── userModel.js         # User schema
│   │   ├── MessagesModel.js     # Message schema
│   │   └── channelModel.js      # Channel schema
│   ├── routes/                  # API routes
│   │   ├── AuthRoutes.js        # Auth endpoints
│   │   ├── MessageRoutes.js     # Message endpoints
│   │   ├── ContactRoutes.js     # Contact endpoints
│   │   └── ChannelRoutes.js     # Channel endpoints
│   ├── middlewares/             # Custom middlewares
│   │   └── AuthMiddle.js        # JWT verification
│   ├── config/                  # Configuration files
│   │   └── gridfs.js            # GridFS setup
│   ├── socket.js                # Socket.IO configuration
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── index.js                 # Server entry point
├── Screenshot/                   # Application screenshots
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/priyanshusingh017/friendzy-chat-app.git
   cd "Chat Application"
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../React_node_chat_app
   npm install
   ```

4. **Environment Configuration**

   Create `.env` files in both `server/` and `React_node_chat_app/` directories:

   **Backend (server/.env)**
   ```env
   # Server Configuration
   PORT=8747
   NODE_ENV=development

   # Database
   DATABASE_URL=mongodb://localhost:27017/friendzy
   # OR for MongoDB Atlas:
   # DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/friendzy

   # Authentication
   JWT_KEY=your_super_secret_jwt_key_change_this_in_production

   # CORS
   ORIGIN=http://localhost:5173
   ```

   **Frontend (React_node_chat_app/.env)**
   ```env
   VITE_SERVER_URL=http://localhost:8747
   ```

5. **Start the development servers**

   **Terminal 1 - Backend server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will start on `http://localhost:8747`

   **Terminal 2 - Frontend application:**
   ```bash
   cd React_node_chat_app
   npm run dev
   ```
   Application will start on `http://localhost:5173`

6. **Open your browser**
   
   Navigate to `http://localhost:5173` to access Friendzy.

## 🎯 Usage Guide

### Getting Started
1. **Register**: Create a new account with email and password
2. **Profile Setup**: 
   - Upload a profile picture
   - Set your first and last name
   - Choose a profile color
3. **Find Contacts**: Search for other users to start chatting

### Direct Messaging
1. Click on **"New DM"** button
2. Search for a user
3. Start your conversation
4. Share text messages, images, and files

### Channel Features
1. **Create Channel**: 
   - Click **"Create Channel"**
   - Set channel name and description
   - Upload a channel icon
   - Add members
2. **Manage Channel** (Admin only):
   - Edit channel details
   - Add/remove members from channel
   - Update channel icon
   - Delete channel

### File Sharing
- Click the attachment icon (📎)
- Select images or documents
- Files are stored securely in GridFS
- View images directly in chat
- Download any shared files

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/user-info` | Get current user | Yes |
| POST | `/api/auth/update-profile` | Update user profile | Yes |
| POST | `/api/auth/add-profile-image` | Upload profile image | Yes |
| DELETE | `/api/auth/remove-profile-image` | Remove profile image | Yes |
| GET | `/api/auth/files/:filename` | Get file from GridFS | No |

### Message Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/messages/get-message` | Get messages with user | Yes |
| POST | `/api/messages/upload-file` | Upload file in DM | Yes |

### Contact Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/contacts/search` | Search contacts | Yes |
| GET | `/api/contacts/get-contacts-for-dm` | Get DM contacts | Yes |
| GET | `/api/contacts/all` | Get all contacts | Yes |

### Channel Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/channels/create-channel` | Create new channel | Yes |
| GET | `/api/channels/get-user-channel` | Get user's channels | Yes |
| GET | `/api/channels/get-channel-messages/:channelId` | Get channel messages | Yes |
| PATCH | `/api/channels/update-channel/:channelId` | Update channel (Admin) | Yes |
| DELETE | `/api/channels/delete-channel/:channelId` | Delete channel (Admin) | Yes |
| POST | `/api/channels/:channelId/members` | Add members to channel (Admin) | Yes |
| DELETE | `/api/channels/:channelId/members/:memberId` | Remove member from channel (Admin) | Yes |

## 🔄 Real-Time Events (Socket.IO)

### Client to Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `sendMessage` | `{ sender, recipient, content, messageType, fileUrl }` | Send DM |
| `send-channel-message` | `{ channelId, sender, content, messageType, fileUrl }` | Send channel message |

### Server to Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `receiveMessage` | `message` | Receive new DM |
| `receive-channel-message` | `message` | Receive channel message |

## 🚀 Deployment

### Prerequisites
- MongoDB Atlas account (for production database)
- Vercel account (for frontend)
- Render/Railway account (for backend)

### Frontend Deployment (Vercel)

1. **Prepare for deployment**
   ```bash
   cd React_node_chat_app
   npm run build
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Or use Vercel CLI:
     ```bash
     npm i -g vercel
     vercel
     ```

3. **Set environment variables in Vercel**
   ```env
   VITE_SERVER_URL=https://your-backend-url.com
   ```

4. **Configure vercel.json** (already included)
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Backend Deployment (Render/Railway)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy on Render**
   - Create new Web Service
   - Connect GitHub repository
   - Set root directory to `server`
   - Build command: `npm install`
   - Start command: `npm start`

3. **Set environment variables**
   ```env
   NODE_ENV=production
   PORT=8747
   DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/friendzy
   JWT_KEY=your_production_jwt_secret
   ORIGIN=https://your-frontend-url.vercel.app
   ```

4. **MongoDB Atlas Setup**
   - Create a cluster
   - Set up database user
   - Whitelist IP addresses (or allow from anywhere: 0.0.0.0/0)
   - Get connection string

### Post-Deployment Checklist

- [ ] Backend server is running
- [ ] Frontend is accessible
- [ ] MongoDB connection is successful
- [ ] CORS is properly configured
- [ ] Socket.IO connection works
- [ ] User registration/login works
- [ ] File uploads work (GridFS)
- [ ] Profile images display correctly
- [ ] Channel images display correctly
- [ ] Real-time messaging functions
- [ ] Channel member management works
- [ ] Environment variables are secure

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds for password security
- **HTTP-Only Cookies**: Prevents XSS attacks
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Multer configuration with file size limits (5MB max)
- **GridFS Storage**: Secure file storage in MongoDB
- **Environment Variables**: Sensitive data in .env files
- **.gitignore**: Prevents committing secrets
- **Admin-Only Operations**: Channel management restricted to admins

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Modern dark theme with purple accents (#8417ff)
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent padding and margins
- **Animations**: Smooth transitions and Lottie animations

### Components
- Custom scrollbars
- Toast notifications
- Loading states
- Error handling
- Empty states with animations
- Responsive layouts
- Accessible forms
- Modal dialogs
- Tooltips
- Avatar components with fallbacks
- Member management UI

## 🧪 Testing

```bash
# Run frontend tests
cd React_node_chat_app
npm run test

# Run backend tests
cd server
npm run test
```

## 📊 Performance Optimizations

- **Code Splitting**: React lazy loading for routes
- **Image Optimization**: GridFS for efficient storage
- **Build Optimization**: Vite for fast builds
- **State Management**: Zustand for minimal re-renders
- **Socket.IO**: Efficient real-time communication
- **Database Indexing**: MongoDB indexes for fast queries
- **Lazy Loading**: Images and components loaded on demand

## 🐛 Troubleshooting

### Common Issues

**Socket.IO connection fails**
- Check CORS configuration
- Verify `ORIGIN` environment variable
- Ensure server is running

**Images not displaying**
- Verify GridFS is initialized
- Check file paths in database
- Ensure `GET_FILE_URL` function is correct

**Authentication errors**
- Check JWT_KEY matches in server
- Verify cookie settings
- Clear browser cookies

**MongoDB connection fails**
- Check DATABASE_URL format
- Verify network access in MongoDB Atlas
- Ensure database user permissions

**Cannot add members to channel**
- Verify you are the channel admin
- Check if members are valid users
- Ensure `/api/channels/:channelId/members` endpoint is accessible

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 Future Enhancements

- [ ] Voice/Video calling
- [ ] Message reactions (emoji)
- [ ] Message editing and deletion
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Push notifications
- [ ] User blocking
- [ ] Message search
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Theme customization
- [ ] Message encryption (E2E)
- [ ] Channel roles (Moderator, Member)
- [ ] Message pinning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Priyanshu Singh**
- GitHub: [@priyanshusingh017](https://github.com/priyanshusingh017)
- LinkedIn: [Priyanshu Singh](https://www.linkedin.com/in/priyanshu-singh-00s7)

## 🙏 Acknowledgments

- [React Team](https://react.dev/) - For the amazing UI framework
- [Socket.IO](https://socket.io/) - For real-time communication
- [MongoDB](https://www.mongodb.com/) - For the robust database
- [Tailwind CSS](https://tailwindcss.com/) - For utility-first styling
- [Radix UI](https://www.radix-ui.com/) - For accessible components
- [Vite](https://vitejs.dev/) - For lightning-fast development
- Open Source Community - For inspiration and tools

## 📞 Support

If you encounter any issues or have questions:
- Open an [Issue](https://github.com/priyanshusingh017/friendzy/issues)
- Check existing [Discussions](https://github.com/priyanshusingh017/friendzy/discussions)

---

<div align="center">
  <h3>⭐ Star this repo if you find it helpful! ⭐</h3>
  <br>
  <strong>Friendzy</strong> - Where conversations come alive! 💬✨
  <br><br>
  Made with ❤️ by Priyanshu Singh
  <br><br>
  <a href="#top">⬆️ Back to Top</a>
</div>
