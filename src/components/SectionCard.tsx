import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = PropsWithChildren<{
  title?: string;
  caption?: string;
}>;

export function SectionCard({ title, caption, children }: Props) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    marginBottom: spacing.sm,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
    marginTop: spacing.sm,
  },
});
