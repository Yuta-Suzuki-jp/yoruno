import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';
import { Calendar, MessageSquare, Clock } from 'lucide-react';

export default function History() {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('diagnosis_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setHistory(data || []);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#0f0518] relative">
            <Header />
            <div className="pt-32 px-4 max-w-2xl mx-auto pb-20">
                <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-purple-400" />
                    Diagnosis History
                </h2>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                        <p className="text-purple-300">No history found.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((item) => (
                            <div key={item.id} className="bg-[#1a1025] border border-purple-900/50 rounded-2xl p-6 transition-all hover:border-purple-500/50 hover:bg-[#20152e]">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-bold text-white">{item.result}</h3>
                                    <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(item.created_at)}
                                    </div>
                                </div>
                                {item.note && (
                                    <div className="flex items-start gap-3 text-purple-200/80 bg-black/20 p-4 rounded-xl">
                                        <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                                        <p className="text-sm font-medium leading-relaxed">{item.note}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
