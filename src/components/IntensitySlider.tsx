import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  value: number; // 0-100
  onChange: (value: number) => void;
  max?: number; // quiet mode caps this below 100
  disabled?: boolean;
};

/** PWM duty-cycle intensity, 0-100%. Maps 1:1 to the servo/motor PWM duty cycle sent over BLE. */
export function IntensitySlider({ label, value, onChange, max = 100, disabled }: Props) {
  const clamped = Math.min(value, max);

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(clamped)}%</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={max}
        step={5}
        value={clamped}
        onValueChange={onChange}
        disabled={disabled}
        minimumTrackTintColor={colors.ember}
        maximumTrackTintColor={colors.emberDim}
        thumbTintColor={colors.emberBright}
      />
      {max < 100 ? <Text style={styles.cap}>Capped at {max}% — Quiet mode</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.label,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
  cap: {
    color: colors.textDisabled,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
  },
});
