import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';
import type { BleConnectionState } from '../ble/BleManagerService';

type Props = {
  connection: BleConnectionState;
  batteryPct: number | null;
};

const LABEL: Record<BleConnectionState, string> = {
  disconnected: 'Not connected',
  scanning: 'Searching…',
  connecting: 'Connecting…',
  connected: 'Connected',
};

/** Small, unobtrusive — deliberately not the focus of the screen. */
export function DeviceStatusBar({ connection, batteryPct }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, connection === 'connected' && styles.dotConnected]} />
      <Text style={styles.text}>{LABEL[connection]}</Text>
      {batteryPct != null ? <Text style={styles.text}>· {batteryPct}%</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emberDim,
  },
  dotConnected: {
    backgroundColor: colors.emberMuted,
  },
  text: {
    color: colors.textDisabled,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
  },
});
