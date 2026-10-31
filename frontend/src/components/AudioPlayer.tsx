"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  subtext?: string;
}

export default function AudioPlayer({ src, title = "Archived Audio Recording", subtext = "Magnetic Tape Reel" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime || 0);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-xl border border-[#3B3428] bg-[#121115] p-5 shadow-2xl relative overflow-hidden">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Cassette Header Bar */}
      <div className="flex items-center justify-between mb-4 border-b border-[#25221E] pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
            {subtext}
          </span>
          <h4 className="font-serif text-sm text-[#E8E0D2] font-medium truncate max-w-sm">
            {title}
          </h4>
        </div>

        {/* Vintage Tape Reels Visual */}
        <div className="flex items-center space-x-3 bg-[#0A0A0C] px-3 py-1.5 rounded-full border border-[#282520]">
          <div className={`w-4 h-4 rounded-full border border-[#D6A65C] flex items-center justify-center ${isPlaying ? "animate-spin" : ""}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D6A65C]" />
          </div>
          <div className="w-6 h-0.5 bg-[#3B3428]" />
          <div className={`w-4 h-4 rounded-full border border-[#D6A65C] flex items-center justify-center ${isPlaying ? "animate-spin" : ""}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#D6A65C]" />
          </div>
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="space-y-1 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-[#25221E] rounded-lg appearance-none cursor-pointer accent-[#D6A65C]"
        />
        <div className="flex justify-between text-[11px] font-mono text-[#7A756D]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-[#D6A65C]/20"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={restart}
            title="Rewind to beginning"
            className="p-2 rounded text-[#9E988E] hover:text-[#E8E0D2] hover:bg-[#1A1816] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={toggleMute}
          className="p-2 rounded text-[#9E988E] hover:text-[#E8E0D2] hover:bg-[#1A1816] transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
