"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";

const songGenres = [
  "Alternative", "Chinese", "Champagne Papi", "City Pop", "Harsh Noise", "Japanese", "Korean", "Metal", "Phonk", "Rage", "Ye Ye", "Rock", "Pop", "R&b", "Rap", "Disco", "Soul", "Trap", "Rap", "Jazz", "Ost", "Country", "Electronic", "Ambient", "Funk", "Punk", "Folk", "Classical", "I CAME TO GOON 🗣️🔥"
];

const japanesePhrases = [
  "電脳空間", "サイバーパンク", "未来都市", "デジタル夢", "バーチャル現実",
  "メタバース", "AI時代", "テクノロジー", "コンピューター", "インターネット",
  "デジタル世界", "仮想現実", "電子の海", "情報社会", "ネットワーク",
  "データストリーム", "コードの森", "アルゴリズム", "プログラム", "ソフトウェア",
  "ハードウェア", "システム", "インターフェース", "データベース", "サーバー",
  "クライアント", "プロトコル", "ファイアウォール", "暗号化", "セキュリティ",
  "ハッカー", "プログラマー", "デベロッパー", "ユーザー", "アカウント",
  "パスワード", "ログイン", "ログアウト", "オンライン", "オフライン",
  "クラウド", "ストレージ", "メモリ", "プロセッサ", "グラフィック",
  "ディスプレイ", "キーボード", "マウス", "ウィンドウ", "アイコン",
  "メニュー", "ツールバー", "ステータスバー", "デスクトップ", "フォルダ",
  "ファイル", "ドキュメント", "アプリケーション", "ブラウザ", "ウェブサイト",
  "ホームページ", "リンク", "ブックマーク", "検索", "ダウンロード",
  "アップロード", "保存", "削除", "コピー", "ペースト",
  "カット", "元に戻す", "やり直し", "設定", "オプション",
  "環境設定", "カスタマイズ", "テーマ", "色", "フォント",
  "サイズ", "位置", "配置", "起動", "終了",
  "再起動", "スリープ", "休止", "エラー", "警告",
  "メッセージ", "通知", "アラート", "成功", "失敗",
  "進行中", "完了", "キャンセル", "はい", "いいえ",
  "適用", "閉じる"
];

const getRandomJapanesePhrase = () => {
  return japanesePhrases[Math.floor(Math.random() * japanesePhrases.length)];
};

export default function Home() {
  const [currentGenre, setCurrentGenre] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhrases, setCurrentPhrases] = useState<Array<{text: string, id: number, x: number, y: number}>>([]);
  const [phraseId, setPhraseId] = useState(0);
  const [showCustomListInput, setShowCustomListInput] = useState(false);
  const [customGenresInput, setCustomGenresInput] = useState("");
  const [activeGenres, setActiveGenres] = useState(songGenres);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [multiplayerStep, setMultiplayerStep] = useState<'menu' | 'username' | 'join' | 'create' | 'lobby' | 'game'>('menu');
  const [username, setUsername] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomSize, setRoomSize] = useState(2);
  const [roomId, setRoomId] = useState("");
  const [players, setPlayers] = useState<Array<{username: string, id: string, isHost: boolean}>>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{username: string, message: string, timestamp: Date}>>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const startMenuRef = useRef<HTMLDivElement>(null);

  // Manage Japanese phrases appearance
  useEffect(() => {
    const showPhrases = () => {
      const numPhrases = Math.floor(Math.random() * 3) + 1; // 1-3 phrases
      const newPhrases = [];
      
      for (let i = 0; i < numPhrases; i++) {
        // Avoid center area where generator window is (roughly 30-70% horizontal, 20-80% vertical)
        let x, y;
        do {
          x = Math.random() * 90 + 5; // 5-95%
          y = Math.random() * 90 + 5; // 5-95%
        } while (
          (x > 25 && x < 75 && y > 15 && y < 85) // Avoid center window area
        );
        
        newPhrases.push({
          text: getRandomJapanesePhrase(),
          id: phraseId + i,
          x: x,
          y: y
        });
      }
      
      setCurrentPhrases(newPhrases);
      setPhraseId(phraseId + numPhrases);
      
      // Remove phrases after 3 seconds (very fast for visibility)
      setTimeout(() => {
        setCurrentPhrases([]);
      }, 3000);
    };

    // Initial show
    showPhrases();
    
    // Set interval for showing phrases (4.5 seconds total: 3s display + 1.5s pause - very fast for visibility)
    const interval = setInterval(showPhrases, 4500);
    
    return () => clearInterval(interval);
  }, [phraseId]);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Handle clicks outside start menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is on the Start button itself
      const startButton = event.target as Element;
      const isStartButton = startButton.closest('[data-start-button="true"]');
      
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node) && !isStartButton) {
        setShowStartMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle URL parameters for joining rooms
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setShowMultiplayer(true);
      setMultiplayerStep('join');
    }
  }, []);

  // Socket.IO connection and event handlers
  useEffect(() => {
    console.log('Attempting to initialize WebSocket connection...');
    
    // Try a simple WebSocket connection first
    let ws: WebSocket;
    let connectionAttempt = 0;
    
    const tryWebSocketConnection = () => {
      connectionAttempt++;
      console.log(`WebSocket connection attempt ${connectionAttempt}`);
      
      try {
        // Try different WebSocket URLs
        const urls = [
          'ws://localhost:3000/api/socketio',
          'ws://127.0.0.1:3000/api/socketio',
          'ws://0.0.0.0:3000/api/socketio',
          `${window.location.origin.replace('http', 'ws')}/api/socketio`
        ];
        
        const url = urls[connectionAttempt - 1];
        console.log(`Trying WebSocket URL: ${url}`);
        
        ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log(`✅ WebSocket connected (attempt ${connectionAttempt})`);
          setConnectionError("");
          
          // Now try Socket.IO with the working base URL
          const socketUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
          trySocketIOConnection(socketUrl);
        };
        
        ws.onerror = (error) => {
          console.error(`❌ WebSocket error (attempt ${connectionAttempt}):`, error);
          
          if (connectionAttempt < urls.length) {
            console.log('Trying next WebSocket URL...');
            setTimeout(tryWebSocketConnection, 1000);
          } else {
            console.log('All WebSocket attempts failed, trying Socket.IO directly...');
            trySocketIOConnectionDirectly();
          }
        };
        
        ws.onclose = (event) => {
          console.log(`WebSocket closed (attempt ${connectionAttempt}):`, event);
        };
        
      } catch (error) {
        console.error(`Error creating WebSocket (attempt ${connectionAttempt}):`, error);
        
        if (connectionAttempt < 4) {
          setTimeout(tryWebSocketConnection, 1000);
        } else {
          trySocketIOConnectionDirectly();
        }
      }
    };
    
    const trySocketIOConnection = (baseUrl: string) => {
      console.log('Trying Socket.IO with working base URL:', baseUrl);
      
      try {
        const socketInstance = io(baseUrl, {
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });
        
        socketInstance.on('connect', () => {
          console.log('✅ Socket.IO connected via WebSocket test');
          setConnectionError("");
          setSocket(socketInstance);
          setupSocketHandlers(socketInstance);
        });
        
        socketInstance.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          setConnectionError(`Failed to connect: ${error.message}`);
        });
        
      } catch (error) {
        console.error('Error creating Socket.IO instance:', error);
        setConnectionError('Failed to create Socket.IO connection');
      }
    };
    
    const trySocketIOConnectionDirectly = () => {
      console.log('Trying Socket.IO connection directly...');
      
      const connectionUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        window.location.origin
      ];
      
      let attempt = 0;
      
      const tryNextUrl = () => {
        if (attempt >= connectionUrls.length) {
          setConnectionError('All connection attempts failed');
          return;
        }
        
        const url = connectionUrls[attempt];
        attempt++;
        console.log(`Trying Socket.IO URL: ${url}`);
        
        try {
          const socketInstance = io(url, {
            path: '/api/socketio',
            transports: ['polling'], // Force polling only
            timeout: 5000,
            forceNew: true,
            reconnection: false,
            autoConnect: true
          });
          
          socketInstance.on('connect', () => {
            console.log(`✅ Socket.IO connected to ${url}`);
            setConnectionError("");
            setSocket(socketInstance);
            setupSocketHandlers(socketInstance);
          });
          
          socketInstance.on('connect_error', (error) => {
            console.error(`❌ Socket.IO error for ${url}:`, error);
            setTimeout(tryNextUrl, 1000);
          });
          
        } catch (error) {
          console.error(`Error creating Socket.IO for ${url}:`, error);
          setTimeout(tryNextUrl, 1000);
        }
      };
      
      tryNextUrl();
    };
    
    const setupSocketHandlers = (socketInstance: Socket) => {
      // Disconnect event
      socketInstance.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from server:', reason);
        setConnectionError(`Disconnected: ${reason}`);
      });
      
      // Debug: Listen for all events
      socketInstance.onAny((eventName, ...args) => {
        if (eventName !== 'ping' && eventName !== 'pong') {
          console.log(`[Socket Event] ${eventName}:`, args);
        }
      });
      
      // Room creation success
      socketInstance.on('roomCreated', (data: { roomId: string; players: any[] }) => {
        setRoomId(data.roomId);
        setPlayers(data.players);
        setMultiplayerStep('lobby');
      });
      
      // Room join success
      socketInstance.on('roomJoined', (data: { roomId: string; players: any[] }) => {
        setRoomId(data.roomId);
        setPlayers(data.players);
        setMultiplayerStep('lobby');
      });
      
      // Room join error
      socketInstance.on('joinError', (data: { message: string }) => {
        alert(`Failed to join room: ${data.message}`);
        setMultiplayerStep('menu');
      });
      
      // Player joined event
      socketInstance.on('playerJoined', (data: { players: any[] }) => {
        setPlayers(data.players);
      });
      
      // Player left event
      socketInstance.on('playerLeft', (data: { players: any[]; message: string }) => {
        setPlayers(data.players);
        console.log(data.message);
      });
      
      // Game started event
      socketInstance.on('gameStarted', (data: { players: any[]; currentPlayer: number }) => {
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setGameStarted(true);
        setMultiplayerStep('game');
      });
      
      // Player turn changed event
      socketInstance.on('playerTurnChanged', (data: { currentPlayer: number; players: any[] }) => {
        setCurrentPlayer(data.currentPlayer);
        setPlayers(data.players);
      });
      
      // Game ended event
      socketInstance.on('gameEnded', (data: { players: any[] }) => {
        setPlayers(data.players);
        setGameStarted(false);
        setMultiplayerStep('lobby');
        setCurrentPlayer(0);
      });
      
      // General error event
      socketInstance.on('error', (data: { message: string }) => {
        alert(`Error: ${data.message}`);
      });
    };
    
    // Start with WebSocket test
    tryWebSocketConnection();
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Glitch effect
  useEffect(() => {
    const glitchOverlay = document.getElementById('glitch-overlay');
    if (glitchOverlay) {
      const glitchInterval = setInterval(() => {
        if (Math.random() > 0.98) { // Less frequent glitching
          glitchOverlay.style.opacity = '1';
          glitchOverlay.style.background = `linear-gradient(${Math.random() * 360}deg, 
            rgba(255,0,255,${Math.random() * 0.3}) 0%, 
            rgba(0,255,255,${Math.random() * 0.3}) 50%, 
            rgba(255,255,0,${Math.random() * 0.3}) 100%)`;
          glitchOverlay.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
          
          setTimeout(() => {
            glitchOverlay.style.opacity = '0';
            glitchOverlay.style.transform = 'translate(0, 0)';
          }, 150); // Slightly longer glitch
        }
      }, 300); // Slower interval

      return () => clearInterval(glitchInterval);
    }
  }, []);

  // Fisher-Yates shuffle algorithm
  const fisherYatesShuffle = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateRandomGenre = () => {
    setIsGenerating(true);
    
    // Add some animation delay for effect
    setTimeout(() => {
      const shuffledGenres = fisherYatesShuffle(activeGenres);
      setCurrentGenre(shuffledGenres[0]); // Take first element from shuffled array
      setIsGenerating(false);
    }, 500);
  };

  const applyCustomGenres = () => {
    if (customGenresInput.trim()) {
      const genres = customGenresInput.split(',').map(genre => genre.trim()).filter(genre => genre.length > 0);
      if (genres.length > 0) {
        setActiveGenres(genres);
        setCurrentGenre(""); // Clear current genre when switching lists
        // Don't clear the input field or hide the input area - keep it visible
      }
    } else {
      // If input is empty, revert to base genres
      setActiveGenres(songGenres);
      setCurrentGenre(""); // Clear current genre when switching lists
    }
  };

  const removeCustomGenres = () => {
    setActiveGenres(songGenres); // Revert to base genres
    setCustomGenresInput(""); // Clear the textbox
    setCurrentGenre(""); // Clear current genre
    setShowCustomListInput(false); // Hide the input area
  };

  // Multiplayer functions
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const testConnection = () => {
    if (socket) {
      console.log('Testing connection...');
      console.log('Socket state:', {
        connected: socket.connected,
        disconnected: socket.disconnected,
        id: socket.id
      });
      
      if (socket.connected) {
        // Test emit a simple event
        socket.emit('test', { message: 'Connection test' });
        console.log('✅ Test event sent');
      } else {
        console.log('❌ Socket not connected, attempting to reconnect...');
        socket.connect();
      }
    } else {
      console.log('❌ No socket instance found');
    }
  };

  const createRoom = () => {
    if (!socket || !username.trim()) {
      alert('Please enter a username and ensure you are connected to the server');
      return;
    }
    
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    
    // Emit socket event to create room
    socket.emit('createRoom', {
      roomId: newRoomId,
      username: username.trim(),
      maxPlayers: roomSize
    });
  };

  const joinRoom = (roomCode: string) => {
    if (!socket || !username.trim()) {
      alert('Please enter a username and ensure you are connected to the server');
      return;
    }
    
    setRoomId(roomCode);
    
    // Emit socket event to join room
    socket.emit('joinRoom', {
      roomId: roomCode,
      username: username.trim()
    });
  };

  const startGame = () => {
    if (!socket) {
      alert('Not connected to server');
      return;
    }
    
    // Emit socket event to start game
    socket.emit('startGame', {
      roomId: roomId
    });
  };

  const nextPlayer = () => {
    if (!socket) {
      alert('Not connected to server');
      return;
    }
    
    // Emit socket event to change player turn
    socket.emit('nextPlayer', {
      roomId: roomId
    });
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        username: username,
        message: newMessage,
        timestamp: new Date()
      }]);
      setNewMessage("");
    }
  };

  const getRoomLink = () => {
    return `${window.location.origin}?room=${roomId}`;
  };

  return (
    <div className="min-h-screen bg-[#edaabb] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Retro Anime 8-bit Vaporwave Y2K Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient with 8-bit style */}
        <div className="absolute inset-0 bg-[#edaabb]"></div>
        

        
        {/* Glitching Japanese phrases */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {currentPhrases.map((phrase) => (
            <div 
              key={phrase.id}
              className="absolute font-mono"
              style={{
                left: `${phrase.x}%`,
                top: `${phrase.y}%`,
                fontSize: `40px`,
                opacity: 1, // Start visible instead of 0
                color: '#000000',
                textShadow: '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff, 3px 3px 0 #ffffff, -3px -3px 0 #ffffff',
                animation: `glitchChar 4s ease-in-out forwards`,
                imageRendering: 'pixelated',
                filter: 'blur(0.5px)',
                transform: 'skew(0deg, 0deg)',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                zIndex: 5 // Ensure it's above other elements
              }}
            >
              {phrase.text}
            </div>
          ))}
        </div>
        

        

        

      </div>

      {/* CRT scanlines effect */}
      <div className="absolute inset-0 pointer-events-none z-40" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)`,
        backgroundSize: '100% 4px',
        animation: 'scanlines 8s linear infinite'
      }}></div>
      
  
      
      {/* Glitch effect overlay */}
      <div className="absolute inset-0 pointer-events-none z-15" id="glitch-overlay"></div>
      




      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-20"> {/* Added pb-20 for taskbar space */}
        {/* Windows 95 style window */}
        <div className="bg-gray-300 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-500 border-b-gray-500 shadow-2xl w-full">
          {/* Title bar */}
          <div className="bg-gradient-to-b from-blue-900 to-blue-700 text-white px-2 sm:px-4 py-2 flex items-center justify-between">
            <div className="w-6 sm:w-8"></div>
            <div className="text-xs sm:text-sm font-bold tracking-wide font-mono flex-1 text-center" style={{ 
              textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
              imageRendering: 'pixelated',
              fontFamily: 'MS Sans Serif, sans-serif'
            }}>
              Cassi Rates Everything Zero
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-500 border-b-gray-500 flex items-center justify-center text-black text-sm sm:text-lg font-bold cursor-pointer hover:bg-gray-400 active:border-t-gray-500 active:border-l-gray-500 active:border-r-white active:border-b-white transform active:translate-y-0.5 transition-all duration-150">
                _
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-500 border-b-gray-500 flex items-center justify-center text-black text-sm sm:text-lg font-bold cursor-pointer hover:bg-gray-400 active:border-t-gray-500 active:border-l-gray-500 active:border-r-white active:border-b-white transform active:translate-y-0.5 transition-all duration-150">
                □
              </div>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 border-2 border-t-white border-l-white border-r-gray-500 border-b-gray-500 flex items-center justify-center text-black text-sm sm:text-lg font-bold cursor-pointer hover:bg-gray-400 active:border-t-gray-500 active:border-l-gray-500 active:border-r-white active:border-b-white transform active:translate-y-0.5 transition-all duration-150">
                ×
              </div>
            </div>
          </div>

          {/* Window content */}
          <div className="p-4 sm:p-6 bg-gray-200">
            {/* Main content area - Windows 95 style */}
            <div className="bg-gray-300 border-2 border-t-gray-500 border-l-gray-500 border-r-gray-100 border-b-gray-100 p-4 sm:p-6 mb-6 shadow-inner">
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-4 font-mono text-sm sm:text-base" style={{ 
                  fontFamily: 'MS Sans Serif, sans-serif',
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  fontWeight: 'bold',
                  imageRendering: 'pixelated',
                  textRendering: 'optimizeSpeed',
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  Welcome to the ultimate genre generator!
                </p>
                <p className="text-sm text-gray-500 font-mono text-xs sm:text-sm" style={{ 
                  fontFamily: 'MS Sans Serif, sans-serif',
                  fontSize: 'clamp(10px, 1.8vw, 12px)',
                  imageRendering: 'pixelated',
                  textRendering: 'optimizeSpeed',
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  Click the button below to generate a random song genre
                </p>
              </div>

              {/* Genre display - Windows 95 style */}
              <div className="bg-white border-2 border-t-gray-500 border-l-gray-500 border-r-gray-100 border-b-gray-100 p-4 sm:p-8 mb-6 min-h-[100px] sm:min-h-[120px] flex items-center justify-center shadow-inner">
                {isGenerating ? (
                  <div className="text-xl sm:text-2xl font-mono text-gray-800" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale',
                    fontWeight: 'bold'
                  }}>
                    GENERATING...
                  </div>
                ) : currentGenre ? (
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 font-mono" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      fontSize: 'clamp(18px, 4vw, 32px)',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      {currentGenre}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center font-mono" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    <div>No genre generated yet</div>
                  </div>
                )}
              </div>

              {/* Generate buttons - Windows 95 style */}
              <div className="text-center flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={generateRandomGenre}
                  disabled={isGenerating}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 sm:px-6 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    fontSize: 'clamp(11px, 2vw, 12px)',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                >
                  {isGenerating ? (
                    <span>
                      PROCESSING...
                    </span>
                  ) : (
                    <span>
                      GENERATE GENRE
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setShowCustomListInput(!showCustomListInput)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 sm:px-6 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-sm sm:text-base"
                  style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    fontSize: 'clamp(11px, 2vw, 12px)',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                >
                  ADD CUSTOM LIST
                </button>
              </div>
              
              {/* Custom list input area */}
              {showCustomListInput && (
                <div className="mt-6 bg-gray-100 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 p-4">
                  <textarea
                    value={customGenresInput}
                    onChange={(e) => setCustomGenresInput(e.target.value)}
                    placeholder="Enter genres separated by commas..."
                    className="w-full p-2 border border-gray-400 bg-white text-gray-800 font-mono text-sm resize-none"
                    rows={4}
                    style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      fontSize: 'clamp(11px, 2vw, 12px)',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 mt-2 justify-center">
                    <button
                      onClick={applyCustomGenres}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-sm"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: 'clamp(10px, 1.8vw, 12px)',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      APPLY
                    </button>
                    <button
                      onClick={removeCustomGenres}
                      className="bg-red-200 hover:bg-red-300 text-gray-800 font-bold py-1 px-4 border-2 border-t-red-100 border-l-red-100 border-r-red-400 border-b-red-400 active:border-t-red-400 active:border-l-red-400 active:border-r-red-100 active:border-b-red-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-sm"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: 'clamp(10px, 1.8vw, 12px)',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      REMOVE CUSTOM LIST
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomListInput(false);
                        // Don't clear the input field - preserve it for next time
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-sm"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: 'clamp(10px, 1.8vw, 12px)',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="bg-gray-300 border-t border-gray-400 px-4 py-1 flex justify-between items-center text-xs text-gray-600 font-mono" style={{ 
              fontFamily: 'MS Sans Serif, sans-serif',
              imageRendering: 'pixelated',
              textRendering: 'optimizeSpeed',
              WebkitFontSmoothing: 'none',
              MozOsxFontSmoothing: 'grayscale'
            }}>
              <div>Ready</div>
              <div>Genres: {activeGenres.length}</div>
              <div>© 2024</div>
            </div>
          </div>
        </div>

        {/* Retro footer */}
        <div className="text-center mt-6 text-gray-300 text-sm">
          {/* Footer text removed */}
        </div>
      </div>

      {/* Windows 95 Start Menu */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Taskbar */}
        <div className="bg-gray-300 h-8 border-t-2 border-t-gray-100 border-l-gray-100 border-r-gray-500 border-b-gray-500 flex items-center px-2">
          {/* Start Button */}
          <div 
            data-start-button="true"
            onClick={() => setShowStartMenu(!showStartMenu)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 mr-2 border-t-2 border-t-green-300 border-l-green-300 border-r-green-700 border-b-green-700 active:border-t-green-700 active:border-l-green-700 active:border-r-green-300 active:border-b-green-300 transform active:translate-y-0.5 transition-all duration-150 cursor-pointer flex items-center gap-1"
          >
            <span className="text-xs font-mono" style={{ 
              fontFamily: 'MS Sans Serif, sans-serif',
              imageRendering: 'pixelated',
              textRendering: 'optimizeSpeed',
              WebkitFontSmoothing: 'none',
              MozOsxFontSmoothing: 'grayscale'
            }}>
              Start
            </span>
          </div>
          
          {/* Taskbar items */}
          <div className="flex-1 flex items-center gap-1">
            <div className="bg-gray-200 border border-gray-400 px-2 py-1 text-xs text-gray-700 font-mono flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500"></div>
              <span style={{ 
                fontFamily: 'MS Sans Serif, sans-serif',
                imageRendering: 'pixelated',
                textRendering: 'optimizeSpeed',
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'grayscale'
              }}>
                Cassi Rates Everything Zero
              </span>
            </div>
          </div>
          
          {/* System tray */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            {/* Connection Status */}
            {connectionError && (
              <div 
                className="bg-red-200 border border-red-400 px-2 py-0.5 cursor-pointer"
                title={connectionError}
              >
                <span style={{ 
                  fontFamily: 'MS Sans Serif, sans-serif',
                  imageRendering: 'pixelated',
                  textRendering: 'optimizeSpeed',
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  ❌
                </span>
              </div>
            )}
            {socket && !connectionError && (
              <div 
                className="bg-green-200 border border-green-400 px-2 py-0.5 cursor-pointer"
                title="Connected to server"
              >
                <span style={{ 
                  fontFamily: 'MS Sans Serif, sans-serif',
                  imageRendering: 'pixelated',
                  textRendering: 'optimizeSpeed',
                  WebkitFontSmoothing: 'none',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  🟢
                </span>
              </div>
            )}
            
            {/* WiFi Button */}
            <div 
              onClick={() => setShowMultiplayer(!showMultiplayer)}
              className="bg-gray-200 border border-gray-400 px-2 py-0.5 cursor-pointer hover:bg-gray-300 transition-colors duration-150"
              title="Multiplayer"
            >
              <span style={{ 
                fontFamily: 'MS Sans Serif, sans-serif',
                imageRendering: 'pixelated',
                textRendering: 'optimizeSpeed',
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'grayscale'
              }}>
                📶
              </span>
            </div>
            <div className="bg-gray-200 border border-gray-400 px-2 py-0.5">
              <span style={{ 
                fontFamily: 'MS Sans Serif, sans-serif',
                imageRendering: 'pixelated',
                textRendering: 'optimizeSpeed',
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'grayscale'
              }}>
                {currentTime}
              </span>
            </div>
          </div>
        </div>

        {/* Windows 95 Start Menu Dropdown */}
        {showStartMenu && (
          <div 
            ref={startMenuRef}
            className="absolute bottom-8 left-0 bg-gray-300 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-500 border-b-gray-500 shadow-lg w-64"
            style={{
              fontFamily: 'MS Sans Serif, sans-serif',
              imageRendering: 'pixelated',
              textRendering: 'optimizeSpeed',
              WebkitFontSmoothing: 'none',
              MozOsxFontSmoothing: 'grayscale'
            }}
          >
            {/* Start Menu Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-4 py-2 text-sm font-bold">
              Cassi_0 OS
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              {/* Settings Option */}
              <div 
                className="flex items-center px-4 py-2 hover:bg-blue-500 hover:text-white cursor-pointer transition-colors duration-150"
                onClick={() => {
                  // Handle settings click
                  setShowStartMenu(false);
                }}
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <div className="w-4 h-4 border border-gray-600 bg-gray-200 flex items-center justify-center text-xs">
                    ⚙
                  </div>
                </div>
                <span className="text-sm font-medium">Settings</span>
              </div>
              
              {/* Separator Line */}
              <div className="border-t border-gray-400 my-1 mx-2"></div>
              
              {/* Additional menu items can be added here */}
            </div>
          </div>
        )}
      </div>

      {/* Multiplayer Interface */}
      {showMultiplayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-300 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-500 border-b-gray-500 shadow-2xl w-96 max-w-full mx-4">
            {/* Multiplayer Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-4 py-2 flex items-center justify-between">
              <div className="text-sm font-bold" style={{ 
                fontFamily: 'MS Sans Serif, sans-serif',
                imageRendering: 'pixelated',
                textRendering: 'optimizeSpeed',
                WebkitFontSmoothing: 'none',
                MozOsxFontSmoothing: 'grayscale'
              }}>
                Multiplayer Mode
              </div>
              <div 
                onClick={() => setShowMultiplayer(false)}
                className="w-6 h-6 bg-gray-200 border border-gray-400 flex items-center justify-center text-black text-xs font-bold cursor-pointer hover:bg-gray-300"
              >
                ×
              </div>
            </div>

            {/* Multiplayer Content */}
            <div className="p-4">
              {multiplayerStep === 'menu' && (
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-4" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Multiplayer Options
                  </h3>
                  <div className="space-y-3">
                    {/* Connection Status Display */}
                    <div className="bg-gray-100 p-3 border border-gray-400">
                      <div className="text-sm font-bold mb-2" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        Connection Status:
                      </div>
                      <div className="text-xs" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        {socket && socket.connected ? (
                          <span className="text-green-600">✅ Connected to server</span>
                        ) : (
                          <span className="text-red-600">❌ Not connected</span>
                        )}
                        {connectionError && (
                          <div className="text-red-600 mt-1">{connectionError}</div>
                        )}
                      </div>
                      <button
                        onClick={testConnection}
                        className="mt-2 w-full bg-blue-200 hover:bg-blue-300 text-gray-800 font-bold py-1 px-3 border-2 border-t-blue-100 border-l-blue-100 border-r-blue-400 border-b-blue-400 active:border-t-blue-400 active:border-l-blue-400 active:border-r-blue-100 active:border-b-blue-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-xs"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                      >
                        Test Connection
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setMultiplayerStep('username')}
                      disabled={!socket || !socket.connected}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Create Room
                    </button>
                    <button
                      onClick={() => setMultiplayerStep('join')}
                      disabled={!socket || !socket.connected}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              )}

              {multiplayerStep === 'username' && (
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-4" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Enter Username
                  </h3>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="w-full p-2 border border-gray-400 bg-white text-gray-800 font-mono text-sm mb-4"
                    style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      fontSize: '12px',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMultiplayerStep('menu')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setMultiplayerStep('create')}
                      disabled={!username.trim()}
                      className="flex-1 bg-blue-200 hover:bg-blue-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-blue-100 border-l-blue-100 border-r-blue-400 border-b-blue-400 active:border-t-blue-400 active:border-l-blue-400 active:border-r-blue-100 active:border-b-blue-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {multiplayerStep === 'join' && (
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-4" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Join Room
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Room Code:
                    </label>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter room code..."
                      className="w-full p-2 border border-gray-400 bg-white text-gray-800 font-mono text-sm mb-4"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Your Username:
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username..."
                      className="w-full p-2 border border-gray-400 bg-white text-gray-800 font-mono text-sm mb-4"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMultiplayerStep('menu')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (roomCodeInput.trim() && username.trim()) {
                          joinRoom(roomCodeInput.trim());
                        }
                      }}
                      disabled={!roomCodeInput.trim() || !username.trim()}
                      className="flex-1 bg-blue-200 hover:bg-blue-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-blue-100 border-l-blue-100 border-r-blue-400 border-b-blue-400 active:border-t-blue-400 active:border-l-blue-400 active:border-r-blue-100 active:border-b-blue-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              )}

              {multiplayerStep === 'create' && (
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-4" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Create Room
                  </h3>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Number of Players:
                    </label>
                    <select
                      value={roomSize}
                      onChange={(e) => setRoomSize(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-400 bg-white text-gray-800 font-mono text-sm"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={5}>5 Players</option>
                      <option value={6}>6 Players</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMultiplayerStep('username')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={createRoom}
                      className="flex-1 bg-green-200 hover:bg-green-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-green-100 border-l-green-100 border-r-green-400 border-b-green-400 active:border-t-green-400 active:border-l-green-400 active:border-r-green-100 active:border-b-green-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Create Room
                    </button>
                  </div>
                </div>
              )}

              {multiplayerStep === 'lobby' && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-center" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Room: {roomId}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        Players ({players.length}/{roomSize}):
                      </h4>
                      <div className="text-xs text-gray-600" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        {players.length === roomSize ? '🟢 Room Full' : '🟡 Waiting for players...'}
                      </div>
                    </div>
                    <div className="bg-white border-2 border-t-gray-500 border-l-gray-500 border-r-gray-100 border-b-gray-100 shadow-inner max-h-40 overflow-y-auto">
                      {players.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between p-3 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold" style={{ 
                              fontFamily: 'MS Sans Serif, sans-serif',
                              imageRendering: 'pixelated',
                              textRendering: 'optimizeSpeed',
                              WebkitFontSmoothing: 'none',
                              MozOsxFontSmoothing: 'grayscale'
                            }}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-bold text-sm" style={{ 
                                fontFamily: 'MS Sans Serif, sans-serif',
                                imageRendering: 'pixelated',
                                textRendering: 'optimizeSpeed',
                                WebkitFontSmoothing: 'none',
                                MozOsxFontSmoothing: 'grayscale'
                              }}>
                                {player.username}
                              </div>
                              <div className="flex gap-1 mt-1">
                                {player.isHost && (
                                  <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded font-bold" style={{ 
                                    fontFamily: 'MS Sans Serif, sans-serif',
                                    imageRendering: 'pixelated',
                                    textRendering: 'optimizeSpeed',
                                    WebkitFontSmoothing: 'none',
                                    MozOsxFontSmoothing: 'grayscale'
                                  }}>
                                    👑 Host
                                  </span>
                                )}
                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded" style={{ 
                                  fontFamily: 'MS Sans Serif, sans-serif',
                                  imageRendering: 'pixelated',
                                  textRendering: 'optimizeSpeed',
                                  WebkitFontSmoothing: 'none',
                                  MozOsxFontSmoothing: 'grayscale'
                                }}>
                                  Player {index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="w-3 h-3 bg-green-400 rounded-full" title="Online"></div>
                          </div>
                        </div>
                      ))}
                      {players.length < roomSize && (
                        <div className="p-3 text-center text-gray-500 text-sm italic" style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}>
                          {roomSize - players.length} more player{roomSize - players.length > 1 ? 's' : ''} needed...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Room Link:
                    </label>
                    <div className="bg-gray-100 p-2 border border-gray-400 text-xs font-mono break-all" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      {getRoomLink()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowMultiplayer(false);
                        setMultiplayerStep('menu');
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                      style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        fontSize: '12px',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      Leave
                    </button>
                    {players[0]?.isHost && players.length >= roomSize && (
                      <button
                        onClick={startGame}
                        className="flex-1 bg-green-200 hover:bg-green-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-green-100 border-l-green-100 border-r-green-400 border-b-green-400 active:border-t-green-400 active:border-l-green-400 active:border-r-green-100 active:border-b-green-100 transform active:translate-y-0.5 transition-all duration-150 font-mono"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '12px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                      >
                        Start Game
                      </button>
                    )}
                  </div>
                </div>
              )}

              {multiplayerStep === 'game' && (
                <div>
                  <h3 className="text-lg font-bold mb-4 text-center" style={{ 
                    fontFamily: 'MS Sans Serif, sans-serif',
                    imageRendering: 'pixelated',
                    textRendering: 'optimizeSpeed',
                    WebkitFontSmoothing: 'none',
                    MozOsxFontSmoothing: 'grayscale'
                  }}>
                    Multiplayer Game
                  </h3>
                  
                  <div className="mb-4 text-center">
                    <div className="text-sm mb-2" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Current Turn:
                    </div>
                    <div className="font-bold text-lg" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      {players[currentPlayer]?.username}
                    </div>
                  </div>

                  {/* Player List */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        Players in Room:
                      </h4>
                      <span className="text-xs text-gray-600" style={{ 
                        fontFamily: 'MS Sans Serif, sans-serif',
                        imageRendering: 'pixelated',
                        textRendering: 'optimizeSpeed',
                        WebkitFontSmoothing: 'none',
                        MozOsxFontSmoothing: 'grayscale'
                      }}>
                        {players.length}/{roomSize}
                      </span>
                    </div>
                    <div className="bg-gray-100 border border-gray-400 max-h-24 overflow-y-auto">
                      {players.map((player, index) => (
                        <div 
                          key={player.id} 
                          className={`flex items-center justify-between p-2 text-xs ${index === currentPlayer ? 'bg-blue-100' : ''}`}
                          style={{ 
                            fontFamily: 'MS Sans Serif, sans-serif',
                            imageRendering: 'pixelated',
                            textRendering: 'optimizeSpeed',
                            WebkitFontSmoothing: 'none',
                            MozOsxFontSmoothing: 'grayscale'
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{player.username}</span>
                            {player.isHost && (
                              <span className="text-xs bg-yellow-200 px-1 rounded" style={{ 
                                fontFamily: 'MS Sans Serif, sans-serif',
                                imageRendering: 'pixelated',
                                textRendering: 'optimizeSpeed',
                                WebkitFontSmoothing: 'none',
                                MozOsxFontSmoothing: 'grayscale'
                              }}>
                                Host
                              </span>
                            )}
                            {index === currentPlayer && (
                              <span className="text-xs bg-green-200 px-1 rounded" style={{ 
                                fontFamily: 'MS Sans Serif, sans-serif',
                                imageRendering: 'pixelated',
                                textRendering: 'optimizeSpeed',
                                WebkitFontSmoothing: 'none',
                                MozOsxFontSmoothing: 'grayscale'
                              }}>
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-gray-600">P{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="bg-white border-2 border-t-gray-500 border-l-gray-500 border-r-gray-100 border-b-gray-100 p-4 mb-4 min-h-[80px] flex items-center justify-center shadow-inner">
                      {currentGenre ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800 mb-2" style={{ 
                            fontFamily: 'MS Sans Serif, sans-serif',
                            fontSize: '18px',
                            imageRendering: 'pixelated',
                            textRendering: 'optimizeSpeed',
                            WebkitFontSmoothing: 'none',
                            MozOsxFontSmoothing: 'grayscale'
                          }}>
                            {currentGenre}
                          </div>
                          <div className="text-xs text-gray-600" style={{ 
                            fontFamily: 'MS Sans Serif, sans-serif',
                            imageRendering: 'pixelated',
                            textRendering: 'optimizeSpeed',
                            WebkitFontSmoothing: 'none',
                            MozOsxFontSmoothing: 'grayscale'
                          }}>
                            Genre for {players[currentPlayer]?.username}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center" style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '14px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}>
                          Click "Spin Genre Wheel" to generate
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={generateRandomGenre}
                        disabled={isGenerating}
                        className="flex-1 bg-blue-200 hover:bg-blue-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-blue-100 border-l-blue-100 border-r-blue-400 border-b-blue-400 active:border-t-blue-400 active:border-l-blue-400 active:border-r-blue-100 active:border-b-blue-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '12px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                      >
                        {isGenerating ? 'Spinning...' : 'Spin Genre Wheel'}
                      </button>
                      <button
                        onClick={nextPlayer}
                        disabled={!currentGenre || isGenerating}
                        className="flex-1 bg-green-200 hover:bg-green-300 text-gray-800 font-bold py-2 px-4 border-2 border-t-green-100 border-l-green-100 border-r-green-400 border-b-green-400 active:border-t-green-400 active:border-l-green-400 active:border-r-green-100 active:border-b-green-100 transform active:translate-y-0.5 transition-all duration-150 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '12px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                      >
                        Next Player
                      </button>
                    </div>
                  </div>

                  {/* Chat System */}
                  <div className="border border-gray-400">
                    <div className="bg-gray-200 px-2 py-1 text-xs font-bold" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      Chat
                    </div>
                    <div className="h-32 overflow-y-auto p-2 bg-white text-xs" style={{ 
                      fontFamily: 'MS Sans Serif, sans-serif',
                      imageRendering: 'pixelated',
                      textRendering: 'optimizeSpeed',
                      WebkitFontSmoothing: 'none',
                      MozOsxFontSmoothing: 'grayscale'
                    }}>
                      {chatMessages.map((msg, index) => (
                        <div key={index} className="mb-1">
                          <span className="font-bold">{msg.username}:</span> {msg.message}
                        </div>
                      ))}
                    </div>
                    <div className="flex p-2 bg-gray-100">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-1 border border-gray-400 bg-white text-gray-800 font-mono text-xs mr-2"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '10px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-2 border-2 border-t-gray-100 border-l-gray-100 border-r-gray-400 border-b-gray-400 active:border-t-gray-400 active:border-l-gray-400 active:border-r-gray-100 active:border-b-gray-100 transform active:translate-y-0.5 transition-all duration-150 font-mono text-xs"
                        style={{ 
                          fontFamily: 'MS Sans Serif, sans-serif',
                          fontSize: '10px',
                          imageRendering: 'pixelated',
                          textRendering: 'optimizeSpeed',
                          WebkitFontSmoothing: 'none',
                          MozOsxFontSmoothing: 'grayscale'
                        }}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-6000 {
          animation-delay: 6s;
        }
        
        @keyframes scanlines {
          0% { background-position: 0 0; }
          100% { background-position: 0 10px; }
        }
        
        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes glitch {
          0%, 100% { 
            transform: translate(0, 0); 
            filter: hue-rotate(0deg);
            text-shadow: 0 0 0 rgba(255,0,255,0.5);
          }
          20% { 
            transform: translate(-2px, 2px); 
            filter: hue-rotate(90deg);
            text-shadow: -2px 0 rgba(255,0,255,0.5), 2px 0 rgba(0,255,255,0.5);
          }
          40% { 
            transform: translate(-2px, -2px); 
            filter: hue-rotate(180deg);
            text-shadow: 2px 0 rgba(255,0,255,0.5), -2px 0 rgba(0,255,255,0.5);
          }
          60% { 
            transform: translate(2px, 2px); 
            filter: hue-rotate(270deg);
            text-shadow: 0 0 10px rgba(255,255,0,0.5);
          }
          80% { 
            transform: translate(2px, -2px); 
            filter: hue-rotate(360deg);
            text-shadow: -2px 0 rgba(0,255,255,0.5), 2px 0 rgba(255,0,255,0.5);
          }
        }
        
        @keyframes glitchChar {
          0% { 
            opacity: 0; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          5% { 
            opacity: 1; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          10% { 
            opacity: 0.7; 
            transform: translate(-3px, 2px) skew(-3deg, 2deg);
            filter: blur(1.5px) hue-rotate(90deg);
          }
          15% { 
            opacity: 1; 
            transform: translate(3px, -2px) skew(2deg, -3deg);
            filter: blur(1px) hue-rotate(180deg);
          }
          20% { 
            opacity: 0.4; 
            transform: translate(-2px, 0) skew(-2deg, 0deg);
            filter: blur(2px) hue-rotate(270deg);
          }
          25% { 
            opacity: 0.9; 
            transform: translate(2px, 0) skew(3deg, 1deg);
            filter: blur(0.5px) hue-rotate(360deg);
          }
          30% { 
            opacity: 0.3; 
            transform: translate(0, -2px) skew(0deg, -2deg);
            filter: blur(1.8px) hue-rotate(45deg);
          }
          35% { 
            opacity: 1; 
            transform: translate(0, 2px) skew(-2deg, 0deg);
            filter: blur(0.8px) hue-rotate(135deg);
          }
          40% { 
            opacity: 0.5; 
            transform: translate(-2px, 0) skew(2deg, 3deg);
            filter: blur(2.2px) hue-rotate(225deg);
          }
          45% { 
            opacity: 0.8; 
            transform: translate(2px, 0) skew(-3deg, -2deg);
            filter: blur(0.6px) hue-rotate(315deg);
          }
          50% { 
            opacity: 0.2; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(1.5px) hue-rotate(0deg);
          }
          55% { 
            opacity: 0.9; 
            transform: translate(-3px, 0) skew(4deg, 0deg);
            filter: blur(1px) hue-rotate(90deg);
          }
          60% { 
            opacity: 0.4; 
            transform: translate(3px, 0) skew(-4deg, 0deg);
            filter: blur(1.8px) hue-rotate(180deg);
          }
          65% { 
            opacity: 1; 
            transform: translate(-1px, 0) skew(2deg, 2deg);
            filter: blur(0.7px) hue-rotate(270deg);
          }
          70% { 
            opacity: 0.3; 
            transform: translate(1px, 0) skew(-2deg, -2deg);
            filter: blur(2px) hue-rotate(360deg);
          }
          75% { 
            opacity: 0.7; 
            transform: translate(0, -2px) skew(0deg, 3deg);
            filter: blur(1.2px) hue-rotate(45deg);
          }
          80% { 
            opacity: 0.4; 
            transform: translate(0, 2px) skew(0deg, -3deg);
            filter: blur(1.8px) hue-rotate(135deg);
          }
          85% { 
            opacity: 0.6; 
            transform: translate(-2px, 0) skew(3deg, 0deg);
            filter: blur(1px) hue-rotate(225deg);
          }
          90% { 
            opacity: 0.2; 
            transform: translate(2px, 0) skew(-3deg, 0deg);
            filter: blur(1.5px) hue-rotate(315deg);
          }
          95% { 
            opacity: 0.1; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(1px) hue-rotate(0deg);
          }
          100% { 
            opacity: 0; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, 30px); }
        }
        
        @keyframes stripeMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        @keyframes floatDot {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 0.1; transform: translateY(90vh) scale(1); }
          90% { opacity: 0.1; transform: translateY(10vh) scale(1); }
          100% { transform: translateY(0) scale(0); opacity: 0; }
        }
        
        @keyframes glitchCharSlow {
          0% { 
            opacity: 0; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          2% { 
            opacity: 0.1; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          4% { 
            opacity: 0.3; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          6% { 
            opacity: 0.6; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          8% { 
            opacity: 0.8; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          10% { 
            opacity: 1; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
          15% { 
            opacity: 0.9; 
            transform: translate(-1px, 1px) skew(-1deg, 1deg);
            filter: blur(0.8px) hue-rotate(30deg);
          }
          20% { 
            opacity: 1; 
            transform: translate(1px, -1px) skew(1deg, -1deg);
            filter: blur(0.6px) hue-rotate(60deg);
          }
          25% { 
            opacity: 0.85; 
            transform: translate(-1px, 0) skew(-1deg, 0deg);
            filter: blur(1px) hue-rotate(90deg);
          }
          30% { 
            opacity: 0.95; 
            transform: translate(1px, 0) skew(1deg, 0.5deg);
            filter: blur(0.7px) hue-rotate(120deg);
          }
          35% { 
            opacity: 0.8; 
            transform: translate(0, -1px) skew(0deg, -1deg);
            filter: blur(1.2px) hue-rotate(150deg);
          }
          40% { 
            opacity: 0.98; 
            transform: translate(0, 1px) skew(-1deg, 0deg);
            filter: blur(0.8px) hue-rotate(180deg);
          }
          45% { 
            opacity: 0.85; 
            transform: translate(-1px, 0) skew(1deg, 1deg);
            filter: blur(1px) hue-rotate(210deg);
          }
          50% { 
            opacity: 0.95; 
            transform: translate(1px, 0) skew(-1deg, -1deg);
            filter: blur(0.6px) hue-rotate(240deg);
          }
          55% { 
            opacity: 0.8; 
            transform: translate(0, -1px) skew(0.5deg, -0.5deg);
            filter: blur(1.1px) hue-rotate(270deg);
          }
          60% { 
            opacity: 0.96; 
            transform: translate(0, 1px) skew(-0.5deg, 0.5deg);
            filter: blur(0.7px) hue-rotate(300deg);
          }
          65% { 
            opacity: 0.85; 
            transform: translate(-1px, 0) skew(1deg, 0deg);
            filter: blur(0.9px) hue-rotate(330deg);
          }
          70% { 
            opacity: 0.95; 
            transform: translate(1px, 0) skew(-1deg, 0deg);
            filter: blur(0.6px) hue-rotate(360deg);
          }
          75% { 
            opacity: 0.8; 
            transform: translate(0, -1px) skew(0deg, -1deg);
            filter: blur(1.3px) hue-rotate(30deg);
          }
          80% { 
            opacity: 0.9; 
            transform: translate(0, 1px) skew(0deg, 1deg);
            filter: blur(0.8px) hue-rotate(60deg);
          }
          82% { 
            opacity: 0.7; 
            transform: translate(-1px, 0) skew(-1deg, 0deg);
            filter: blur(1.5px) hue-rotate(90deg);
          }
          84% { 
            opacity: 0.5; 
            transform: translate(1px, 0) skew(1deg, 0deg);
            filter: blur(1.2px) hue-rotate(120deg);
          }
          86% { 
            opacity: 0.3; 
            transform: translate(0, -1px) skew(0deg, -1deg);
            filter: blur(1.8px) hue-rotate(150deg);
          }
          88% { 
            opacity: 0.2; 
            transform: translate(0, 1px) skew(0deg, 1deg);
            filter: blur(2px) hue-rotate(180deg);
          }
          90% { 
            opacity: 0.1; 
            transform: translate(-0.5px, 0) skew(-0.5deg, 0deg);
            filter: blur(2.2px) hue-rotate(210deg);
          }
          92% { 
            opacity: 0.05; 
            transform: translate(0.5px, 0) skew(0.5deg, 0deg);
            filter: blur(2.4px) hue-rotate(240deg);
          }
          94% { 
            opacity: 0.02; 
            transform: translate(0, -0.5px) skew(0deg, -0.5deg);
            filter: blur(2.6px) hue-rotate(270deg);
          }
          96% { 
            opacity: 0.01; 
            transform: translate(0, 0.5px) skew(0deg, 0.5deg);
            filter: blur(2.8px) hue-rotate(300deg);
          }
          98% { 
            opacity: 0.005; 
            transform: translate(-0.5px, 0) skew(-0.5deg, 0deg);
            filter: blur(3px) hue-rotate(330deg);
          }
          100% { 
            opacity: 0; 
            transform: translate(0, 0) skew(0deg, 0deg);
            filter: blur(0.5px) hue-rotate(0deg);
          }
        }
        
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-slow-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
        
        #glitch-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0;
          transition: all 0.1s ease;
          mix-blend-mode: overlay;
          z-index: 15;
        }
        
        /* CRT flicker effect */
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.98; }
        }
        
        body {
          animation: flicker 0.1s infinite;
        }
        
        /* Text shadow glitch effect for headers */
        .glitch-text {
          text-shadow: 
            2px 2px 0px rgba(255,0,255,0.5),
            -2px -2px 0px rgba(0,255,255,0.5),
            0px 0px 10px rgba(255,255,0,0.3);
          animation: glitch 3s infinite;
        }
      `}</style>
    </div>
  );
}