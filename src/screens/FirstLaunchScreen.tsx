import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton, SafetyDisclaimer } from '../components';
import { colors, typography, spacing } from '../theme';

type Props = {
  onAcknowledge: () => void;
};

export function FirstLaunchScreen({ onAcknowledge }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Before you start</Text>
        <SafetyDisclaimer />
        <BigButton label="I understand" onPress={onAcknowledge} testID="first-launch-ack" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    marginBottom: spacing.lg,
  },
});
