import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AttackModeScreen } from '../screens/AttackModeScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { DiaryScreen } from '../screens/DiaryScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, typography } from '../theme';

export type TabParamList = {
  Attack: undefined;
  Insights: undefined;
  Diary: undefined;
  Export: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Attack: '●',
  Insights: '▲',
  Diary: '▦',
  Export: '↥',
  Settings: '◐',
};

const iconStyles = StyleSheet.create({
  icon: { color: colors.textPrimary, fontSize: 16 },
});

function TabIcon({ routeName }: { routeName: keyof TabParamList }) {
  return <Text style={iconStyles.icon}>{ICONS[routeName]}</Text>;
}

const tabBarStyle = { backgroundColor: colors.background, borderTopColor: colors.border };
const tabBarLabelStyle = { fontFamily: typography.fontFamily, fontSize: typography.caption };

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle,
        tabBarIcon: () => <TabIcon routeName={route.name as keyof TabParamList} />,
        tabBarLabelStyle,
      })}
    >
      <Tab.Screen name="Attack" component={AttackModeScreen} options={{ tabBarLabel: 'Attack' }} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Diary" component={DiaryScreen} />
      <Tab.Screen name="Export" component={ExportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
