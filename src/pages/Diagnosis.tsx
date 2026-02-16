import { useState, useEffect, useRef } from 'react';
import { Heart, XCircle, CheckCircle, Mic2, Star, Sparkles, ChevronRight, Moon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Header from '../components/Header';

// --- 子守唄の歌詞データ ---
const LULLABY_LYRICS = [
    "ねんねん、ころりよ、おころりよ。",
    "ぼうやは、よいこだ、ねんねしな。",
    "ぼうやの、おもりは、どこへいった。",
    "あのやま、こえて、さとへいった。",
    "さとの、みやげに、なにもろた。",
    "でんでん、たいこに、しょうのふえ。",
    "おきあがりこぼしに、いぬはりこ。",
    "さあさあ、よるは、しずかにふけていく。",
    "ほしも、キラキラ、みているよ。",
    "いーい、ゆめみて、ねむりなさい。",
    "おやすみ、おやすみ、またあした。"
];

// --- 共通の決め台詞 ---
const FINAL_PHRASE = "ちゃんと、ゴムを、つけてね。";

// --- フローチャートデータ ---
const flowData: Record<string, any> = {
    start: {
        id: 'start',
        type: 'question',
        text: '今夜、夜の営みをしたいですか？',
        options: [
            { label: 'Yes! したい！', nextId: 'partner_gender' },
            { label: 'No... おやすみ', nextId: 'result_sleep' },
        ],
    },
    partner_gender: {
        id: 'partner_gender',
        type: 'question',
        text: 'お相手は男性ですか？女性ですか？',
        options: [
            { label: '男性 ♂', nextId: 'is_tired' },
            { label: '女性 ♀', nextId: 'is_period' },
        ],
    },
    is_period: {
        id: 'is_period',
        type: 'question',
        text: 'その女性は女の子の日ですか？',
        options: [
            { label: 'そうなの...', nextId: 'result_period_stop' },
            { label: '違うよ！', nextId: 'mood_check' },
        ],
    },
    mood_check: {
        id: 'mood_check',
        type: 'question',
        text: 'お互いの雰囲気は良いですか？',
        options: [
            { label: '最高！✨', nextId: 'result_go' },
            { label: '微妙かも...', nextId: 'result_wine' },
        ],
    },
    is_tired: {
        id: 'is_tired',
        type: 'question',
        text: 'お相手は仕事でお疲れですか？',
        options: [
            { label: 'お疲れ気味💦', nextId: 'result_massage' },
            { label: '元気ハツラツ💪', nextId: 'result_go' },
        ],
    },
    // --- 結果ノード ---
    result_sleep: {
        id: 'result_sleep',
        type: 'result',
        text: 'Sleep Tight',
        subText: '睡眠は最高の健康法です。私の歌声で、安らかな眠りについてください...',
        sing: true,
        voiceText: `ゆっくり、寝ましょう。おやすみなさい。${FINAL_PHRASE}`,
        isBad: false,
        iconType: 'sleep',
        theme: 'cyan',
    },
    result_period_stop: {
        id: 'result_period_stop',
        type: 'result',
        text: 'Not Today',
        subText: '無理はいけません。温かい飲み物でも淹れてあげましょう。',
        voiceText: `今日は、できません。無理は、いけません。${FINAL_PHRASE}`,
        isBad: true,
        iconType: 'bad',
        theme: 'red',
        youtubeId: 'SbEoiPwADM4',
    },
    result_go: {
        id: 'result_go',
        type: 'result',
        text: 'Have a Nice Night!',
        subText: '準備はいいですか？楽しんでください。',
        voiceText: `素敵な夜を。楽しんでください。${FINAL_PHRASE}`,
        isBad: false,
        iconType: 'heart',
        theme: 'pink',
    },
    result_wine: {
        id: 'result_wine',
        type: 'result',
        text: 'Relax First',
        subText: 'まずはワインでも飲んで、リラックスした会話を楽しみましょう。',
        voiceText: `まずは、ムード作りから始めましょう。${FINAL_PHRASE}`,
        isBad: false,
        iconType: 'default',
        theme: 'purple',
    },
    result_massage: {
        id: 'result_massage',
        type: 'result',
        text: 'Healing Time',
        subText: 'まずはマッサージをして労いましょう。',
        voiceText: `癒やしが必要です。マッサージをしてあげましょう。${FINAL_PHRASE}`,
        isBad: false,
        iconType: 'default',
        theme: 'purple',
    },
};

export default function Diagnosis() {
    const [path, setPath] = useState<string[]>(['start']);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSinging, setIsSinging] = useState(false);
    const [isPlayingBgm, setIsPlayingBgm] = useState(false);
    const [bgmId, setBgmId] = useState<string | null>(null);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lyricsIndexRef = useRef(0);

    // 初期化
    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
            if (synthRef.current.onvoiceschanged !== undefined) {
                synthRef.current.onvoiceschanged = () => { };
            }
        }
        return () => {
            cancelSpeech();
        };
    }, []);

    // スクロール追従
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [path, isSinging, lyricsIndexRef.current]);

    const cancelSpeech = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
        setIsSinging(false);
        setIsPlayingBgm(false);
        setBgmId(null);
    };

    const createUtterance = (text: string, isSong = false) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.pitch = 0.4;
        utterance.volume = 1.0;
        utterance.rate = isSong ? 0.65 : 0.9;

        if (synthRef.current) {
            const voices = synthRef.current.getVoices();
            const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.name.includes('Japanese'));
            if (jpVoice) utterance.voice = jpVoice;
        }
        return utterance;
    };

    const speakDeepVoice = (text: string, onEndCallback?: () => void) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();

        setTimeout(() => {
            const u = createUtterance(text, false);
            u.onstart = () => setIsSpeaking(true);
            u.onend = () => {
                setIsSpeaking(false);
                if (onEndCallback) onEndCallback();
            };
            u.onerror = () => {
                setIsSpeaking(false);
                if (onEndCallback) onEndCallback();
            };

            synthRef.current?.speak(u);
        }, 100);
    };

    const playNextLyric = () => {
        if (!synthRef.current || lyricsIndexRef.current >= LULLABY_LYRICS.length) {
            setIsSinging(false);
            return;
        }
        const text = LULLABY_LYRICS[lyricsIndexRef.current];
        const u = createUtterance(text, true);
        u.onend = () => {
            lyricsIndexRef.current++;
            setTimeout(playNextLyric, 700);
        };
        u.onerror = () => setIsSinging(false);
        synthRef.current.speak(u);
    };

    const startSinging = () => {
        setIsSinging(true);
        lyricsIndexRef.current = 0;
        playNextLyric();
    };

    // 履歴保存処理
    const saveHistory = async (node: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('diagnosis_history').insert({
                user_id: user.id,
                result: node.text,
                note: node.subText
            });
        }
    };

    const handleSelect = (currentIndex: number, nextId: string) => {
        cancelSpeech();

        const newPath = path.slice(0, currentIndex + 1);
        newPath.push(nextId);
        setPath(newPath);

        const nextNode = flowData[nextId];

        if (nextNode && nextNode.type === 'result') {
            // 履歴保存を試みる
            saveHistory(nextNode);

            setTimeout(() => {
                speakDeepVoice(nextNode.voiceText, () => {
                    if (nextNode.sing) {
                        startSinging();
                    } else if (nextNode.youtubeId) {
                        setIsPlayingBgm(true);
                    }
                });
            }, 600);

            if (nextNode.youtubeId) {
                setBgmId(nextNode.youtubeId);
            }
        }
    };

    const handleReset = () => {
        cancelSpeech();
        setPath(['start']);
    };

    const renderIcon = (node: any) => {
        const iconClass = "w-16 h-16 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]";
        switch (node.iconType) {
            case 'heart': return <Heart className={`${iconClass} text-pink-500 animate-pulse`} />;
            case 'sleep': return <Moon className={`${iconClass} text-cyan-400`} />;
            case 'bad': return <XCircle className={`${iconClass} text-red-500`} />;
            default: return node.isBad ? <XCircle className={`${iconClass} text-red-500`} /> : <CheckCircle className={`${iconClass} text-purple-400`} />;
        }
    };

    const getThemeStyles = (theme: string) => {
        switch (theme) {
            case 'pink': return { card: 'border-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] bg-gradient-to-br from-pink-900/40 to-purple-900/40', text: 'text-pink-300', title: 'text-pink-100', accent: 'bg-pink-500' };
            case 'cyan': return { card: 'border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.3)] bg-gradient-to-br from-cyan-900/40 to-blue-900/40', text: 'text-cyan-300', title: 'text-cyan-100', accent: 'bg-cyan-500' };
            case 'red': return { card: 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] bg-gradient-to-br from-red-900/40 to-orange-900/40', text: 'text-red-300', title: 'text-red-100', accent: 'bg-red-500' };
            default: return { card: 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-gradient-to-br from-purple-900/40 to-indigo-900/40', text: 'text-purple-300', title: 'text-purple-100', accent: 'bg-purple-500' };
        }
    };

    return (
        <div className="min-h-screen pb-32 overflow-hidden bg-[#0f0518] relative">
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <Header onReset={handleReset} />

            <div className="relative z-10 pt-28 px-4 max-w-2xl mx-auto flex flex-col items-center gap-8">
                {path.map((nodeId, index) => {
                    const node = flowData[nodeId];
                    const isLast = index === path.length - 1;
                    const nextNodeId = path[index + 1];
                    const theme = getThemeStyles(node.theme || 'purple');

                    return (
                        <div key={`${nodeId}-${index}`} className="w-full flex flex-col items-center animate-slideDown">
                            <div className={`relative w-full transition-all duration-500 ${node.type === 'result' ? 'max-w-md' : 'max-w-sm'}`}>
                                {node.type === 'question' && (
                                    <div className={`bg-[#1a1025] border-2 rounded-[2rem] p-8 transition-all duration-500 ${!isLast ? 'opacity-50 scale-95 border-purple-900/30 grayscale-[0.5]' : 'scale-100 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]'}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 font-bold text-sm">Q{index + 1}</span>
                                            <h3 className="font-bold text-xl text-white leading-tight">{node.text}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {node.options.map((option: any, optIndex: number) => {
                                                const isSelected = nextNodeId === option.nextId;
                                                const isInactive = !isLast && !isSelected;
                                                return (
                                                    <button key={optIndex} onClick={() => handleSelect(index, option.nextId)} disabled={!isLast && isInactive} className={`group relative w-full py-4 px-6 rounded-2xl text-left font-bold transition-all duration-300 border-2 flex items-center justify-between ${isSelected ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white shadow-lg shadow-purple-500/25 scale-[1.02]' : isInactive ? 'bg-[#150a1f] text-gray-600 border-transparent' : 'bg-[#251b30] text-purple-200 border-purple-500/30 hover:border-purple-400 hover:bg-[#2d223a] hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]'}`}>
                                                        <span>{option.label}</span>
                                                        {isSelected ? <CheckCircle className="w-5 h-5 text-white animate-popIn" /> : <ChevronRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${isLast ? '-translate-x-2 group-hover:translate-x-0' : ''}`} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {node.type === 'result' && (
                                    <div className={`border-4 rounded-[2.5rem] p-8 text-center relative overflow-hidden animate-popIn backdrop-blur-sm ${theme.card}`}>
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/20 animate-spin-slow" />
                                            <Star className="absolute bottom-4 left-4 w-4 h-4 text-white/20 animate-bounce-slow" />
                                        </div>
                                        <div className="flex justify-center mb-6 relative">
                                            <div className={`absolute inset-0 blur-[40px] ${theme.accent} opacity-30`}></div>
                                            <div className="relative z-10 transform transition-transform hover:scale-110 duration-500">{renderIcon(node)}</div>
                                        </div>
                                        <h2 className={`text-4xl font-black mb-4 drop-shadow-lg ${theme.title}`}>{node.text}</h2>
                                        <div className={`h-1 w-20 mx-auto rounded-full mb-6 ${theme.accent}`}></div>
                                        <p className={`text-lg font-medium mb-8 leading-relaxed ${theme.text}`}>{node.subText}</p>
                                        <div className="bg-black/30 rounded-2xl p-6 backdrop-blur-md border border-white/5">
                                            {isLast && isSpeaking && !isSinging && (
                                                <div className="flex flex-col items-center gap-2 animate-fadeIn">
                                                    <div className="flex gap-1 mb-2">{[...Array(3)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${theme.accent} animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}</div>
                                                    <span className={`${theme.text} text-sm font-bold tracking-wider uppercase`}>Voice Playing...</span>
                                                </div>
                                            )}
                                            {isLast && isSinging && (
                                                <div className="flex flex-col items-center animate-fadeIn w-full">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-opacity-20 ${theme.accent} ${theme.text} mb-4`}>
                                                        <Mic2 className="w-4 h-4" /><span>SINGING MODE</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-white mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] min-h-[3rem] flex items-center justify-center">♪ {LULLABY_LYRICS[lyricsIndexRef.current] || "..."}</p>
                                                    <div className="flex gap-1.5 items-end h-12 w-full justify-center">
                                                        {[...Array(12)].map((_, i) => <div key={i} className={`w-1.5 rounded-full ${theme.accent} animate-musicBar`} style={{ height: '30%', animationDelay: `${i * 0.05}s`, animationDuration: '0.6s' }}></div>)}
                                                    </div>
                                                </div>
                                            )}
                                            {isLast && isPlayingBgm && bgmId && (
                                                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg animate-fadeIn border border-white/10">
                                                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${bgmId}?autoplay=1&controls=0&loop=1&playlist=${bgmId}`} title="YouTube BGM" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                                                </div>
                                            )}
                                            {isLast && !isSpeaking && !isSinging && !isPlayingBgm && (
                                                <div className="text-gray-500 text-xs font-mono uppercase tracking-widest">End of Session</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!isLast && (
                                <div className="h-12 w-[2px] bg-purple-900/50 my-2 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500 to-transparent animate-slideDown"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} className="h-32"></div>
            </div>
        </div>
    );
}
