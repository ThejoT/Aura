import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { sessionsRepo, settingsRepo } from '../db';
import { bleService } from '../ble';
import { scheduleFollowUpNotifications } from '../services/notificationService';
import {
  clampIntensitiesForQuietMode,
  clampModesForQuietMode,
  elapsedSecondsSince,
  remainingCooldownSeconds,
  MAX_SESSION_SECONDS,
  COOLDOWN_SECONDS,
} from '../services/sessionEngine';
import type { FollowUp, IntensityState, ModeState, Placement, Session, StopReason, SymptomTag } from '../types';

type Phase = 'idle' | 'active' | 'cooldown';

interface PendingCheckIn {
  session: Session;
  followUp: FollowUp;
}

interface SessionContextValue {
  phase: Phase;
  currentSession: Session | null;
  elapsedSec: number;
  cooldownRemainingSec: number;
  modes: ModeState;
  intensities: IntensityState;
  placement: Placement;
  quietMode: boolean;
  pendingBaselinePrompt: boolean;
  pendingCheckIns: PendingCheckIn[];
  toggleMode: (key: keyof ModeState) => void;
  setIntensity: (key: keyof ModeState, value: number) => void;
  setPlacement: (p: Placement) => void;
  setQuietMode: (on: boolean) => void;
  startSession: () => Promise<void>;
  stopSession: (reason: StopReason) => Promise<void>;
  submitBaseline: (pain: number | null) => Promise<void>;
  submitFollowUp: (sessionId: string, atMinutes: 30 | 120, rating: number | null, tags: SymptomTag[], skipped: boolean) => Promise<void>;
  refreshPendingCheckIns: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const DEFAULT_MODES: ModeState = { paddles: true, vibration: false, rotation: false };
const DEFAULT_INTENSITIES: IntensityState = { paddles: 60, vibration: 60, rotation: 60 };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState(0);
  const [modesState, setModesState] = useState<ModeState>(DEFAULT_MODES);
  const [intensitiesState, setIntensitiesState] = useState<IntensityState>(DEFAULT_INTENSITIES);
  const [placement, setPlacement] = useState<Placement>('temples');
  const [quietMode, setQuietModeState] = useState(false);
  const [pendingBaselinePrompt, setPendingBaselinePrompt] = useState(false);
  const [pendingCheckIns, setPendingCheckIns] = useState<PendingCheckIn[]>([]);

  const modes = useMemo(() => clampModesForQuietMode(modesState, quietMode), [modesState, quietMode]);
  const intensities = useMemo(
    () => clampIntensitiesForQuietMode(intensitiesState, quietMode),
    [intensitiesState, quietMode],
  );

  const currentSessionRef = useRef(currentSession);
  currentSessionRef.current = currentSession;

  const refreshPendingCheckIns = useCallback(async () => {
    const pending = await sessionsRepo.getPendingFollowUps();
    setPendingCheckIns(pending);
  }, []);

  const finishSessionLocally = useCallback(async (session: Session, reason: StopReason) => {
    const { endedAt } = await sessionsRepo.endSession(session.id, reason);
    await bleService.sendStop();
    const finalSession = await sessionsRepo.getSession(session.id);
    if (finalSession) await scheduleFollowUpNotifications(finalSession);

    const until = endedAt + COOLDOWN_SECONDS * 1000;
    await settingsRepo.setSetting(settingsRepo.SETTINGS_KEYS.cooldownUntil, String(until));
    setCooldownUntil(until);
    setCurrentSession(null);
    setPhase('cooldown');
    setPendingBaselinePrompt(false);
    refreshPendingCheckIns();
  }, [refreshPendingCheckIns]);

  // Resume state on mount: catch up on a session that was active when the app was last killed,
  // or a cooldown that was already in progress.
  useEffect(() => {
    (async () => {
      const active = await sessionsRepo.getMostRecentSession();
      if (active && active.endedAt === null) {
        const elapsed = elapsedSecondsSince(active.startedAt);
        if (elapsed >= MAX_SESSION_SECONDS) {
          await finishSessionLocally(active, 'auto_20min');
        } else {
          setCurrentSession(active);
          setModesState(active.modes);
          setIntensitiesState(active.intensities);
          setPlacement(active.placement);
          setQuietModeState(active.quietMode);
          setElapsedSec(elapsed);
          setPhase('active');
          setPendingBaselinePrompt(active.baselinePain === null);
          return;
        }
      }

      const storedCooldown = await settingsRepo.getSetting(settingsRepo.SETTINGS_KEYS.cooldownUntil);
      const until = storedCooldown ? Number(storedCooldown) : null;
      if (until && until > Date.now()) {
        setCooldownUntil(until);
        setPhase('cooldown');
      }
      const storedQuiet = await settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.quietModeDefault);
      setQuietModeState(storedQuiet);
      refreshPendingCheckIns();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1s tick while active or cooldown, driven off wall-clock timestamps (not a naive counter)
  // so backgrounding the app never desyncs the displayed time.
  useEffect(() => {
    if (phase === 'idle') return;
    const interval = setInterval(() => {
      if (phase === 'active' && currentSessionRef.current) {
        const elapsed = elapsedSecondsSince(currentSessionRef.current.startedAt);
        setElapsedSec(elapsed);
        if (elapsed >= MAX_SESSION_SECONDS) {
          finishSessionLocally(currentSessionRef.current, 'auto_20min');
        }
      } else if (phase === 'cooldown') {
        const remaining = remainingCooldownSeconds(cooldownUntil);
        setCooldownRemainingSec(remaining);
        if (remaining <= 0) {
          setPhase('idle');
          refreshPendingCheckIns();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, cooldownUntil, finishSessionLocally, refreshPendingCheckIns]);

  // Catch up immediately when the app returns to the foreground, rather than waiting for the next tick.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      if (phase === 'active' && currentSessionRef.current) {
        const elapsed = elapsedSecondsSince(currentSessionRef.current.startedAt);
        setElapsedSec(elapsed);
        if (elapsed >= MAX_SESSION_SECONDS) finishSessionLocally(currentSessionRef.current, 'auto_20min');
      } else if (phase === 'cooldown') {
        setCooldownRemainingSec(remainingCooldownSeconds(cooldownUntil));
      }
      refreshPendingCheckIns();
    });
    return () => sub.remove();
  }, [phase, cooldownUntil, finishSessionLocally, refreshPendingCheckIns]);

  const toggleMode = useCallback((key: keyof ModeState) => {
    setModesState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setIntensity = useCallback((key: keyof ModeState, value: number) => {
    setIntensitiesState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setQuietMode = useCallback((on: boolean) => {
    setQuietModeState(on);
    settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.quietModeDefault, on);
  }, []);

  const startSession = useCallback(async () => {
    if (phase !== 'idle') return;
    const session = await sessionsRepo.createSession({ modes, intensities, placement, quietMode });
    setCurrentSession(session);
    setElapsedSec(0);
    setPhase('active');
    setPendingBaselinePrompt(true);
    await bleService.sendControl(modes, intensities, quietMode);
  }, [phase, modes, intensities, placement, quietMode]);

  const stopSession = useCallback(
    async (reason: StopReason) => {
      if (!currentSessionRef.current) return;
      await finishSessionLocally(currentSessionRef.current, reason);
    },
    [finishSessionLocally],
  );

  const submitBaseline = useCallback(async (pain: number | null) => {
    if (!currentSessionRef.current) return;
    await sessionsRepo.setBaselinePain(currentSessionRef.current.id, pain);
    setCurrentSession(prev => (prev ? { ...prev, baselinePain: pain } : prev));
    setPendingBaselinePrompt(false);
  }, []);

  const submitFollowUp = useCallback(
    async (sessionId: string, atMinutes: 30 | 120, rating: number | null, tags: SymptomTag[], skipped: boolean) => {
      await sessionsRepo.recordFollowUp(sessionId, atMinutes, rating, tags, skipped);
      await refreshPendingCheckIns();
    },
    [refreshPendingCheckIns],
  );

  const value: SessionContextValue = {
    phase,
    currentSession,
    elapsedSec,
    cooldownRemainingSec,
    modes,
    intensities,
    placement,
    quietMode,
    pendingBaselinePrompt,
    pendingCheckIns,
    toggleMode,
    setIntensity,
    setPlacement,
    setQuietMode,
    startSession,
    stopSession,
    submitBaseline,
    submitFollowUp,
    refreshPendingCheckIns,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
