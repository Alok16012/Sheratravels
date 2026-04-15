import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import loginBg from '../assets/login-bg.png'

export default function Login() {
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate auth delay
    setTimeout(() => {
      if (id === 'admin' && pass === 'admin123') {
        localStorage.setItem('shara_auth', 'true')
        toast.success('Welcome back, Admin!')
        navigate('/')
      } else {
        toast.error('Invalid ID or Password')
      }
      setLoading(false)
    }, 800)
  }

  return (
    <div className="login-container">
      <div className="login-bg-overlay">
        <img src={loginBg} alt="Background" />
      </div>
      
      <div className="login-box glass">
        <div className="login-header">
          <div className="login-logo">✈️</div>
          <h1>Shera Travels</h1>
          <p>Itinerary Maker & CRM</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label>ID</label>
            <input 
              type="text" 
              placeholder="Enter admin ID"
              value={id}
              onChange={e => setId(e.target.value)}
              required
            />
          </div>
          
          <div className="login-field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>© 2026 Shera Travels. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #000;
        }
        
        .login-bg-overlay {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        
        .login-bg-overlay img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.6;
          filter: blur(4px);
        }
        
        .login-box {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        
        .login-logo {
          font-size: 48px;
          margin-bottom: 16px;
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .login-header h1 {
          font-size: 32px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .login-header p {
          color: #94a3b8;
          font-size: 14px;
          margin-bottom: 32px;
        }
        
        .login-form {
          text-align: left;
        }
        
        .login-field {
          margin-bottom: 20px;
        }
        
        .login-field label {
          display: block;
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          margin-left: 4px;
        }
        
        .login-field input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        
        .login-field input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.08);
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        
        .btn-block {
          width: 100%;
          padding: 14px;
          font-size: 16px;
          margin-top: 12px;
        }
        
        .login-footer {
          margin-top: 32px;
          color: #64748b;
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}
