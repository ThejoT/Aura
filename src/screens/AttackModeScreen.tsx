import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  BigButton,
  DeviceStatusBar,
  IntensitySlider,
  ModeToggle,
  PlacementSelector,
  WarningBanner,
} from '../components';
import { BaselineOverlay, CheckInModal } from './PainCapture';
import { useSession } from '../state/SessionContext';
import { useBleDevice } from '../ble';
import { useMedicationOveruseStatus } from '../hooks/useMedicationOveruseStatus';
import { colors, typography, spacing } from '../theme';
import { formatClock } from '../utils/date';
import {
  MAX_SESSION_SECONDS,
  QUIET_MODE_DISABLED_MODE,
  QUIET_MODE_PADDLE_CAP_PCT,
} from '../services/sessionEngine';
import type { ModeKey, SymptomTag } from '../types';

const MODE_LABELS: Record<ModeKey, string> = {
  paddles: 'Paddles',
  vibration: 'Vibration',
  rotation: 'Rotation',
};

export function AttackModeScreen() {
  const session = useSession();
  const ble = useBleDevice();
  const { status: mohStatus } = useMedicationOveruseStatus();
  const [dismissedMoh, setDismissedMoh] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<null | { sessionId: string; atMinutes: 30 | 120 }>(null);

  // Re-attempts on every focus, not just first mount — otherwise turning on
  // Settings → "Simulate headband" (or plugging in a real device) after this
  // screen already tried and failed to connect would need an app restart to
  // take effect, since bottom-tab screens stay mounted when you switch tabs.
  useFocusEffect(
    useCallback(() => {
      if (ble.connection === 'disconnected') {
        ble.connect();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ble.connection]),
  );

  const canShowBanners = session.phase !== 'active';
  const nextCheckIn = canShowBanners ? session.pendingCheckIns[0] : null;

  const handleStart = async () => {
    await session.startSession();
  };

  const handleStop = async () => {
    await session.stopSession('manual');
  };

  const minutesLeft = Math.max(0, MAX_SESSION_SECONDS - session.elapsedSec);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <DeviceStatusBar connection={ble.connection} batteryPct={ble.batteryPct} />
        </View>

        {canShowBanners && mohStatus?.message && !dismissedMoh ? (
          <WarningBanner text={mohStatus.message} onDismiss={() => setDismissedMoh(true)} />
        ) : null}

        {nextCheckIn ? (
          <WarningBanner
            text={`Rate how you feel now — ${nextCheckIn.followUp.atMinutes === 30 ? '30-minute' : '2-hour'} check-in is ready.`}
            onPress={() =>
              setActiveCheckIn({ sessionId: nextCheckIn.session.id, atMinutes: nextCheckIn.followUp.atMinutes as 30 | 120 })
            }
          />
        ) : null}

        <View style={styles.centerBlock}>
          {session.phase === 'active' ? (
            <>
              <Text style={styles.timer}>{formatClock(session.elapsedSec)}</Text>
              <Text style={styles.timerCaption}>
                {minutesLeft <= 0 ? 'Stopping…' : `Auto-stop in ${formatClock(minutesLeft)}`}
              </Text>
              <BigButton label="Stop" variant="danger" onPress={handleStop} style={styles.button} />
            </>
          ) : session.phase === 'cooldown' ? (
            <BigButton
              label="Cooldown"
              subLabel={`${formatClock(session.cooldownRemainingSec)} until you can start again`}
              disabled
              onPress={() => {}}
              style={styles.button}
            />
          ) : (
            <BigButton label="Start Relief" onPress={handleStart} style={styles.button} testID="start-relief" />
          )}
        </View>

        <Text style={styles.sectionLabel}>Modes</Text>
        <View style={styles.modeRow}>
          {(Object.keys(MODE_LABELS) as ModeKey[]).map(key => {
            const isQuietDisabled = session.quietMode && key === QUIET_MODE_DISABLED_MODE;
            return (
              <ModeToggle
                key={key}
                label={MODE_LABELS[key]}
                active={session.modes[key]}
                onToggle={() => session.toggleMode(key)}
                disabled={isQuietDisabled}
                disabledReason={isQuietDisabled ? 'Off in Quiet mode' : undefined}
              />
            );
          })}
        </View>

        {(Object.keys(MODE_LABELS) as ModeKey[]).map(key =>
          session.modes[key] ? (
            <IntensitySlider
              key={key}
              label={`${MODE_LABELS[key]} intensity`}
              value={session.intensities[key]}
              onChange={v => session.setIntensity(key, v)}
              max={session.quietMode && key === 'paddles' ? QUIET_MODE_PADDLE_CAP_PCT : 100}
            />
          ) : null,
        )}

        <Text style={styles.sectionLabel}>Placement</Text>
        <PlacementSelector value={session.placement} onChange={session.setPlacement} />

        <View style={styles.quietRow}>
          <View style={styles.quietTextWrap}>
            <Text style={styles.quietLabel}>Quiet mode</Text>
            <Text style={styles.quietCaption}>Caps paddle speed, disables rotation (the loudest actuator)</Text>
          </View>
          <Switch
            value={session.quietMode}
            onValueChange={session.setQuietMode}
            trackColor={{ false: colors.emberDim, true: colors.ember }}
            thumbColor={colors.emberBright}
          />
        </View>
      </ScrollView>

      <BaselineOverlay visible={session.pendingBaselinePrompt} onSubmit={session.submitBaseline} />

      {activeCheckIn ? (
        <CheckInModal
          visible
          atMinutes={activeCheckIn.atMinutes}
          onClose={() => setActiveCheckIn(null)}
          onSubmit={async (rating, tags: SymptomTag[], skipped) => {
            await session.submitFollowUp(activeCheckIn.sessionId, activeCheckIn.atMinutes, rating, tags, skipped);
            setActiveCheckIn(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  statusRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  centerBlock: { alignItems: 'center', marginVertical: spacing.lg },
  button: { width: '100%' },
  timer: {
    color: colors.textPrimary,
    fontSize: typography.huge,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    fontVariant: ['tabular-nums'],
  },
  timerCaption: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  quietTextWrap: { flex: 1, paddingRight: spacing.md },
  quietLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
  },
  quietCaption: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
    marginTop: 2,
  },
});
