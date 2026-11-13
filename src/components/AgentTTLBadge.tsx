import React, { useState, useEffect } from 'react';
import { AgentHarness } from '@/lib/types';
import { useAxiomStore } from '@/lib/store';

export const AgentTTLBadge: React.FC<{ agent: AgentHarness }> = ({ agent }) => {
  const { triggerKillSwitch } = useAxiomStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!agent.expires_at || agent.status === 'revoked') return null;
    return Math.max(
      0,
      Math.floor((new Date(agent.expires_at).getTime() - Date.now()) / 1000)
    );
  });

  useEffect(() => {
    if (!agent.expires_at || agent.status === 'revoked') {
      return;
    }

    const calculateTimeLeft = () => {
      const expires = new Date(agent.expires_at!).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((expires - now) / 1000);
      return diff > 0 ? diff : 0;
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === 0 && agent.status !== 'revoked') {
        triggerKillSwitch(agent.id);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [agent.expires_at, agent.status, agent.id, triggerKillSwitch]);

  if (!agent.expires_at || agent.status === 'revoked') {
    return null;
  }

  if (timeLeft === null) return null;

  if (timeLeft === 0) {
    return (
      <div className="flex items-center justify-between text-zinc-400 py-0.5">
        <span>TTL Countdown:</span>
        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          EXPIRED
        </span>
      </div>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const timeString = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  let colorClass = "text-emerald-400";
  let bgClass = "";
  if (timeLeft < 30) {
    colorClass = "text-rose-400 animate-pulse";
    bgClass = "bg-rose-500/10 border border-rose-500/20";
  } else if (timeLeft < 120) {
    colorClass = "text-rose-400";
  } else if (timeLeft < 600) {
    colorClass = "text-amber-400";
  }

  return (
    <div className="flex items-center justify-between text-zinc-400 py-0.5">
      <span>TTL Countdown:</span>
      <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${colorClass} ${bgClass}`}>
        {timeString}
      </span>
    </div>
  );
};
