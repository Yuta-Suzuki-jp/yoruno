import { Moon, RefreshCcw, LogIn, History } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useEffect, useState } from 'react';

export default function Header({ onReset }: { onReset?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0f0518]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-lg">
            <Link to="/" className="flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg shadow-purple-500/30 animate-glow group-hover:scale-105 transition-transform">
                    <Moon className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 tracking-wider">
                        Night Chart
                    </h1>
                    <p className="text-[10px] font-bold text-purple-300/70 uppercase tracking-[0.2em]">Interactive Diagnosis</p>
                </div>
            </Link>

            <div className="flex items-center gap-3">
                {session ? (
                    <>
                        <Link to="/history" className="p-2 text-purple-300 hover:text-white transition-colors" title="History">
                            <History className="w-5 h-5" />
                        </Link>
                        <button onClick={handleLogout} className="text-xs font-bold text-purple-400 hover:text-pink-400 border border-purple-500/30 px-3 py-1.5 rounded-full transition-colors">
                            LOGOUT
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="p-2 text-purple-300 hover:text-white transition-colors" title="Login">
                        <LogIn className="w-5 h-5" />
                    </Link>
                )}

                {location.pathname === '/' && onReset && (
                    <button
                        onClick={onReset}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 border border-white/10 group ml-2"
                        title="Restart"
                    >
                        <RefreshCcw className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                )}
            </div>
        </div>
    );
}
