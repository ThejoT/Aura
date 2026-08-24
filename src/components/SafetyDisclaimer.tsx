import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SectionCard } from './SectionCard';
import { colors, typography } from '../theme';

/** Shared compliance copy — shown at first launch and re-viewable anytime from Settings. */
export function SafetyDisclaimer() {
  return (
    <>
      <SectionCard>
        <Text style={styles.body}>
          Aura is a wellness device. It does not diagnose or treat migraine, and nothing in this
          app is medical advice. It offers non-medication mechanical relief (pressure, vibration,
          and rotation) and helps you track what happens when you use it.
        </Text>
      </SectionCard>

      <SectionCard title="Seek medical care if you have:">
        <Text style={styles.listItem}>• A sudden, severe headache unlike any before ("thunderclap")</Text>
        <Text style={styles.listItem}>• Headache with fever, stiff neck, confusion, or a rash</Text>
        <Text style={styles.listItem}>• Headache with weakness, numbness, vision loss, or trouble speaking</Text>
        <Text style={styles.listItem}>• A head injury before the headache started</Text>
        <Text style={styles.listItem}>• A change in your usual headache pattern, or your worst headache ever</Text>
        <Text style={[styles.body, styles.emphasis]}>
          These need urgent medical evaluation — do not wait for this app or the device to help.
        </Text>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    lineHeight: 26,
  },
  listItem: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    lineHeight: 26,
  },
  emphasis: {
    marginTop: 8,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
