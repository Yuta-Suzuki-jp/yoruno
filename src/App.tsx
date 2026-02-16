import { useState, useEffect, useRef } from 'react';
import { Moon, Heart, XCircle, CheckCircle, RefreshCcw, Volume2, Mic2, ChevronDown } from 'lucide-react';

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
      { label: 'はい', nextId: 'partner_gender' },
      { label: 'いいえ', nextId: 'result_sleep' },
    ],
  },
  partner_gender: {
    id: 'partner_gender',
    type: 'question',
    text: 'お相手は男性ですか？女性ですか？',
    options: [
      { label: '男性', nextId: 'is_tired' },
      { label: '女性', nextId: 'is_period' },
    ],
  },
  is_period: {
    id: 'is_period',
    type: 'question',
    text: 'その女性は女の子の日ですか？',
    options: [
      { label: 'はい', nextId: 'result_period_stop' },
      { label: 'いいえ', nextId: 'mood_check' },
    ],
  },
  mood_check: {
    id: 'mood_check',
    type: 'question',
    text: 'お互いの雰囲気は良いですか？',
    options: [
      { label: '最高です', nextId: 'result_go' },
      { label: '微妙かも', nextId: 'result_wine' },
    ],
  },
  is_tired: {
    id: 'is_tired',
    type: 'question',
    text: 'お相手は仕事でお疲れですか？',
    options: [
      { label: '疲れてる', nextId: 'result_massage' },
      { label: '元気ハツラツ', nextId: 'result_go' },
    ],
  },
  // --- 結果ノード ---
  result_sleep: {
    id: 'result_sleep',
    type: 'result',
    text: 'ゆっくり寝ましょう。',
    subText: '睡眠は最高の健康法です。私の歌声で、安らかな眠りについてください...',
    sing: true, // 歌うフラグ
    voiceText: `ゆっくり、寝ましょう。おやすみなさい。${FINAL_PHRASE}`,
    isBad: false,
    iconType: 'sleep',
  },
  result_period_stop: {
    id: 'result_period_stop',
    type: 'result',
    text: '今日はできません。',
    subText: '無理はいけません。温かい飲み物でも淹れてあげましょう。',
    voiceText: `今日は、できません。無理は、いけません。${FINAL_PHRASE}`,
    isBad: true,
    iconType: 'bad',
  },
  result_go: {
    id: 'result_go',
    type: 'result',
    text: '素敵な夜を。',
    subText: '準備はいいですか？楽しんでください。',
    voiceText: `素敵な夜を。楽しんでください。${FINAL_PHRASE}`,
    isBad: false,
    iconType: 'heart',
  },
  result_wine: {
    id: 'result_wine',
    type: 'result',
    text: 'ムード作りから。',
    subText: 'まずはワインでも飲んで、リラックスした会話を楽しみましょう。',
    voiceText: `まずは、ムード作りから始めましょう。${FINAL_PHRASE}`,
    isBad: false,
    iconType: 'default',
  },
  result_massage: {
    id: 'result_massage',
    type: 'result',
    text: '癒やしが必要です。',
    subText: 'まずはマッサージをして労いましょう。',
    voiceText: `癒やしが必要です。マッサージをしてあげましょう。${FINAL_PHRASE}`,
    isBad: false,
    iconType: 'default',
  },
};

export default function App() {
  const [path, setPath] = useState<string[]>(['start']);
  const [isSpeaking, setIsSpeaking] = useState(false); // 通常のセリフ再生中か
  const [isSinging, setIsSinging] = useState(false);   // 歌っているか

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
  };

  // --- 発話オブジェクト作成 ---
  const createUtterance = (text: string, isSong = false) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    // 野太い声の設定
    utterance.pitch = 0.4;
    utterance.volume = 1.0;

    if (isSong) {
      utterance.rate = 0.65; // 歌
    } else {
      utterance.rate = 0.9; // セリフ
    }

    if (synthRef.current) {
      const voices = synthRef.current.getVoices();
      const jpVoice = voices.find(v => v.lang === 'ja-JP' || v.name.includes('Japanese'));
      if (jpVoice) utterance.voice = jpVoice;
    }

    return utterance;
  };

  // --- 再生ロジック: セリフ ---
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

  // --- 再生ロジック: 歌 ---
  const playNextLyric = () => {
    if (!synthRef.current) return;

    if (lyricsIndexRef.current >= LULLABY_LYRICS.length) {
      setIsSinging(false);
      return;
    }

    const text = LULLABY_LYRICS[lyricsIndexRef.current];
    const u = createUtterance(text, true);

    u.onstart = () => { };

    u.onend = () => {
      lyricsIndexRef.current++;
      setTimeout(() => {
        playNextLyric();
      }, 700);
    };

    u.onerror = () => {
      setIsSinging(false);
    };

    synthRef.current.speak(u);
  };

  const startSinging = () => {
    setIsSinging(true);
    lyricsIndexRef.current = 0;
    playNextLyric();
  };

  // --- インタラクション ---
  const handleSelect = (currentIndex: number, nextId: string) => {
    cancelSpeech();

    const newPath = path.slice(0, currentIndex + 1);
    newPath.push(nextId);
    setPath(newPath);

    const nextNode = flowData[nextId];

    // 結果ノードの場合、自動再生
    if (nextNode && nextNode.type === 'result') {
      setTimeout(() => {
        // セリフ読み上げ（「ゴムをつけてね」を含む）
        speakDeepVoice(nextNode.voiceText, () => {
          // その後、歌フラグがあれば歌う
          if (nextNode.sing) {
            startSinging();
          }
        });
      }, 600);
    }
  };

  const handleReset = () => {
    cancelSpeech();
    setPath(['start']);
  };

  // UIヘルパー
  const renderIcon = (node: any) => {
    switch (node.iconType) {
      case 'heart':
        return <Heart className="w-12 h-12 text-pink-500 animate-pulse" />;
      case 'sleep':
        return <Moon className="w-12 h-12 text-indigo-400" />;
      case 'bad':
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return node.isBad ?
          <XCircle className="w-12 h-12 text-red-500" /> :
          <CheckCircle className="w-12 h-12 text-green-500" />;
    }
  };

  const getResultStyles = (node: any) => {
    if (node.isBad) return {
      borderColor: 'border-red-900/50',
      gradient: 'from-red-900 to-red-600',
      iconBg: 'bg-red-500/10 border-red-500/20'
    };
    if (node.sing) return {
      borderColor: 'border-indigo-500/50',
      gradient: 'from-indigo-400 to-blue-500',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20'
    };
    return {
      borderColor: 'border-slate-700',
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      iconBg: 'bg-green-500/10 border-green-500/20'
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500 selection:text-white pb-20">

      {/* 固定ヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-900/30 rounded-lg">
            <Moon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-wider">Night Chart</h1>
            <p className="text-xs text-slate-500">Interactive Diagnosis</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          title="最初からやり直す"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {/* メインエリア */}
      <div className="pt-24 px-4 max-w-2xl mx-auto flex flex-col items-center">

        {path.map((nodeId, index) => {
          const node = flowData[nodeId];
          const isLast = index === path.length - 1;
          const nextNodeId = path[index + 1];

          return (
            <div key={`${nodeId}-${index}`} className="w-full flex flex-col items-center animate-slideDown">

              <div className={`relative w-full transition-all duration-500 ${node.type === 'result' ? 'max-w-md' : 'max-w-sm'}`}>

                {/* 質問モード */}
                {node.type === 'question' && (
                  <div className={`
                    bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl transition-all duration-500
                    ${!isLast ? 'opacity-60 scale-95 border-slate-800' : 'scale-100 border-purple-500/50 shadow-purple-900/20'}
                  `}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-lg text-slate-100">{node.text}</h3>
                      <span className="text-xs font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">Q{index + 1}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {node.options.map((option: any, optIndex: number) => {
                        const isSelected = nextNodeId === option.nextId;
                        const isInactive = !isLast && !isSelected;

                        return (
                          <button
                            key={optIndex}
                            onClick={() => handleSelect(index, option.nextId)}
                            disabled={!isLast && isInactive}
                            className={`
                              relative py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300
                              flex items-center justify-center gap-2
                              ${isSelected
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50 ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900'
                                : isInactive
                                  ? 'bg-slate-800 text-slate-600 cursor-default border border-slate-800'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600'
                              }
                            `}
                          >
                            {option.label}
                            {isSelected && <ChevronDown className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 結果モード */}
                {node.type === 'result' && (() => {
                  const styles = getResultStyles(node);
                  return (
                    <div className={`
                      bg-gradient-to-br from-slate-900 to-slate-800 border-2 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-popIn
                      ${styles.borderColor}
                    `}>
                      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${styles.gradient}`}></div>

                      <div className="flex justify-center mb-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border ${styles.iconBg}`}>
                          {renderIcon(node)}
                        </div>
                      </div>

                      <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                        {node.text}
                      </h2>
                      <p className="text-slate-400 mb-6 leading-relaxed">
                        {node.subText}
                      </p>

                      <div className="flex flex-col items-center gap-4 min-h-[30px] w-full">

                        {/* 自動再生ステータス表示 */}
                        {isLast && isSpeaking && !isSinging && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 animate-pulse transition-all border border-purple-500/30">
                            <Volume2 className="w-4 h-4" />
                            <span>野太い声で再生中...</span>
                          </div>
                        )}

                        {/* 歌唱中表示 */}
                        {isLast && isSinging && (
                          <div className="w-full flex flex-col items-center animate-fadeIn mt-2 pt-4 border-t border-slate-700/50">

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-300 animate-pulse transition-all border border-indigo-500/30">
                              <Mic2 className="w-4 h-4" />
                              <span>野太い声で歌唱中...</span>
                            </div>

                            <div className="mt-6 flex flex-col items-center gap-2 w-full">
                              <div className="min-h-[3rem] flex items-center justify-center text-center w-full px-4">
                                <p className="text-lg font-serif text-indigo-200 animate-fadeIn drop-shadow-lg leading-relaxed">
                                  ♪ {LULLABY_LYRICS[lyricsIndexRef.current] || "..."}
                                </p>
                              </div>

                              <div className="flex gap-1 items-end h-8 mt-2">
                                {[...Array(7)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1.5 bg-indigo-400 rounded-t animate-musicBar"
                                    style={{
                                      height: '100%',
                                      animationDelay: `${i * 0.1}s`,
                                      animationDuration: '0.8s'
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 音声終了後の静止状態 */}
                        {isLast && !isSpeaking && !isSinging && (
                          <div className="text-slate-500 text-xs mt-2">
                            音声再生終了
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

              {!isLast && (
                <div className="h-8 w-0.5 bg-gradient-to-b from-purple-500 to-slate-800 my-2 relative opacity-50">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 border-b-2 border-r-2 border-slate-700 rotate-45 transform translate-y-1"></div>
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} className="h-16"></div>
      </div>
    </div>
  );
}
