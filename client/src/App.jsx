import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Home from './pages/Home';
import Create from './pages/Create';
import Join from './pages/Join';
import Chat from './pages/Chat';
import './index.css';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
      <p className="text-gray-400 mb-6">This page doesn't exist.</p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  </div>
);

function App() {
  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/chat/:token/join" element={<Join />} />
          <Route path="/chat/:token" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
