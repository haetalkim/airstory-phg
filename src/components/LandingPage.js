import React, { useMemo, useState } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Users, 
  Beaker, 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Leaf,
  Shield,
  Activity,
} from 'lucide-react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95 transition-all",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm active:scale-95 transition-all",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95 transition-all",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 transition-all"
  };

  return (
    <button className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const AIR_FACTS = [
  "Trees act as natural air filters! One mature tree can absorb up to 48 lbs of CO2 per year.",
  "PM2.5 particles are about 30 times smaller than the width of a human hair.",
  "Rain can temporarily lower airborne particle levels by washing pollutants out of the air.",
  "Indoor air can sometimes be more polluted than outdoor air without proper ventilation.",
  "Morning and evening rush hours often show higher roadside pollution levels.",
  "High humidity can change how some pollutants behave and how particles stay suspended.",
  "Urban green spaces can reduce local air temperature and improve nearby air quality.",
  "Wind speed and direction strongly affect where pollution travels across a city.",
  "Long-term exposure to poor air quality can impact both lung and heart health.",
  "Air quality sensors help communities spot local hotspots that citywide averages can miss.",
];

const LandingPage = ({ onLogin, onRegister, filters, authError, authLoading }) => {
  const [mode, setMode] = useState('student');
  const [email, setEmail] = useState('jiin@tamgu.com');
  const [password, setPassword] = useState('password');
  const [fullName, setFullName] = useState('New User');
  const [signupPeriod, setSignupPeriod] = useState(filters.period || 'P1');
  const [signupGroup, setSignupGroup] = useState(filters.group || 'G1');
  const [showVerification, setShowVerification] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const randomAirFact = useMemo(
    () => AIR_FACTS[Math.floor(Math.random() * AIR_FACTS.length)],
    []
  );

  // Update email when mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'teacher') {
      setEmail('shim@tamgu.com');
    } else {
      setEmail('jiin@tamgu.com');
    }
  };

  const handleLoginAttempt = () => {
    if (!isSignUp && ((mode === 'student' && (email === 'jiin@tamgu.com' || email === 'julia@tamgu.com') && password === 'password') ||
        (mode === 'teacher' && email === 'shim@tamgu.com' && password === 'password'))) {
      setShowVerification(true);
    } else {
      if (isSignUp) {
        onRegister({ email, password, fullName, mode, period: signupPeriod, group: signupGroup });
      } else {
        onLogin({ email, password, mode });
      }
    }
  };

  const confirmVerification = () => {
    setShowVerification(false);
    if (isSignUp) {
      onRegister({ email, password, fullName, mode, period: signupPeriod, group: signupGroup });
    } else {
      onLogin({ email, password, mode });
    }
  };

  if (showHelp) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
          <Users size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Needs Teacher Assistance</h2>
          <p className="text-gray-600 font-medium">
            Please ask your teacher to verify your account details or reset your password.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowHelp(false)} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          {mode === 'student' ? <GraduationCap size={40} /> : <Users size={40} />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Confirm User Info</h2>
          <p className="text-gray-600 font-medium">Is this you?</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-left space-y-4">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{mode === 'student' ? 'Student Name' : 'Instructor Name'}</p>
            <p className="text-lg font-bold text-gray-900">{mode === 'student' ? 'Jiin Kim' : 'Instructor Shim'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Access Level</p>
            <p className="text-lg font-bold text-gray-900">{mode === 'student' ? 'Science 4B - Grade 4' : 'Campus Administrator'}</p>
          </div>
          {mode === 'student' && (
            <div>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Assigned Group</p>
               <p className="text-lg font-bold text-blue-600 font-mono">Group {filters.group.replace('G', '')} ({filters.school}-{filters.instructor}-{filters.period})</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="danger" onClick={() => { setShowVerification(false); setShowHelp(true); }}>
            <XCircle size={20} /> No
          </Button>
          <Button variant="success" onClick={confirmVerification}>
            <CheckCircle size={20} /> Yes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Side: Info */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold text-sm border border-blue-100">
            <Leaf size={16} className="text-green-500" />
            <span>TAMGU LAB @TC</span>
          </div>
          
          <div className="space-y-4 group">
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.05] cursor-default">
              <span className="text-blue-600">A</span>
              <span className="max-w-0 overflow-hidden inline-block group-hover:max-w-[300px] transition-all duration-700 ease-in-out">
                <span className="text-gray-900">ir</span>
              </span>
              <span className="text-blue-600 ml-1">B</span>
              <span className="max-w-0 overflow-hidden inline-block group-hover:max-w-[300px] transition-all duration-700 ease-in-out">
                <span className="text-gray-900">io</span>
              </span>
              <span className="text-blue-600 ml-1">C</span>
              <span className="max-w-0 overflow-hidden inline-block group-hover:max-w-[300px] transition-all duration-700 ease-in-out">
                <span className="text-gray-900">ivic</span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-lg leading-relaxed">
              Connecting biology, civic responsibility, and real-time air quality data in your classroom.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-105">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <Beaker size={20}/>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Experiments</p>
                <p className="text-xs text-gray-500 font-medium">Hands-on STEM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-105">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Activity size={20}/>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Live Data</p>
                <p className="text-xs text-gray-500 font-medium">Real sensors</p>
              </div>
            </div>
          </div>

          {/* Educational "Did you know?" Section - Toned down */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 transition-colors hover:bg-white group">
            <div className="flex gap-4 items-center">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-0.5">Random Air Fact of the Day!</h4>
                <p className="font-semibold text-gray-700 leading-snug">
                  {randomAirFact}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login */}
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-cyan-100 rounded-full blur-3xl opacity-50 -z-10" />
          
          <div className="bg-white rounded-[2.5rem] p-3 shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-[2rem] mb-8">
              <button 
                onClick={() => handleModeChange('student')}
                className={`py-3.5 rounded-[1.75rem] font-bold text-sm transition-all duration-300 ${mode === 'student' ? 'bg-white text-blue-600 shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Student Access
              </button>
              <button 
                onClick={() => handleModeChange('teacher')}
                className={`py-3.5 rounded-[1.75rem] font-bold text-sm transition-all duration-300 ${mode === 'teacher' ? 'bg-white text-blue-600 shadow-lg scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Teacher Portal
              </button>
            </div>

            <div className="px-8 pb-10 space-y-6">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600 transform -rotate-6 group hover:rotate-0 transition-transform">
                  {mode === 'student' ? <GraduationCap size={40} /> : <Users size={40} />}
                </div>
                <h3 className="text-2xl font-black text-gray-900">
                  {isSignUp ? 'Create Account' : (mode === 'student' ? 'Student Login' : 'Instructor Login')}
                </h3>
                <p className="text-gray-500 font-medium mt-1">
                  {isSignUp ? 'Set up your account credentials.' : 'Enter your school credentials to begin.'}
                </p>
              </div>

              <div className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    {mode === 'student' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Period</label>
                          <select
                            value={signupPeriod}
                            onChange={(e) => setSignupPeriod(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          >
                            {['P1', 'P2', 'P3'].map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Group</label>
                          <select
                            value={signupGroup}
                            onChange={(e) => setSignupGroup(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                          >
                            {['G1', 'G2', 'G3', 'G4', 'G5'].map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@school.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>

              <Button onClick={handleLoginAttempt} className="w-full py-4 text-lg">
                {isSignUp ? 'Create Account' : (mode === 'student' ? 'Join Lab Session' : 'Access Dashboard')} 
                <ArrowRight size={22} className="ml-1" />
              </Button>
              <button
                type="button"
                onClick={() => setIsSignUp((prev) => !prev)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
              </button>
              {authError && (
                <p className="text-sm text-red-600 text-center font-medium">{authError}</p>
              )}
              {authLoading && (
                <p className="text-sm text-gray-500 text-center font-medium">Signing in...</p>
              )}
              
              <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
                <Shield size={14} className="text-gray-400" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secure School Login</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;