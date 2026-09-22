import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/ChatContext';
import Home from './pages/Home';
import Create from './pages/Create';
import Join from './pages/Join';
import Chat from './pages/Chat';
import './index.css';

/* ── 404 ── */
const NotFound = () => (
  <div className="z-page min-h-screen flex items-center justify-center">
    <div className="text-center animate-scale-in">
      <h1 className="text-8xl font-bold gradient-text mb-4">404</h1>
      <p className="text-gray-400 mb-8 text-lg">This page doesn't exist.</p>
      <a href="/" className="btn-primary">← Go Home</a>
    </div>
  </div>
);

function App() {
  return (
    <ChatProvider>
      {/* Animated glass mesh background — rendered once, fixed, behind all pages */}
      <div className="bg-mesh" aria-hidden="true">
        <span className="bg-mesh-extra" />
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/"                    element={<Home />}   />
          <Route path="/create"              element={<Create />} />
          <Route path="/chat/:token/join"    element={<Join />}   />
          <Route path="/chat/:token"         element={<Chat />}   />
          <Route path="*"                    element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

export default App;
