import notifee, { AndroidImportance, TimestampTrigger, TriggerType } from '@notifee/react-native';
import type { Session } from '../types';

const CHANNEL_ID = 'aura-checkins';
const CHANNEL_ID_SAFETY = 'aura-safety';

let channelsReady = false;

async function ensureChannels(): Promise<void> {
  if (channelsReady) return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Pain check-ins',
    importance: AndroidImportance.DEFAULT,
  });
  await notifee.createChannel({
    id: CHANNEL_ID_SAFETY,
    name: 'Safety reminders',
    importance: AndroidImportance.HIGH,
  });
  channelsReady = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

/**
 * Schedules the 30-minute and 2-hour follow-up prompts for a just-ended
 * session. Tapping either opens the app with data pointing at this session
 * + follow-up so the app can route straight to the check-in screen — see
 * `getInitialCheckInRoute` / the foreground/background event handlers
 * wired up in App.tsx.
 */
export async function scheduleFollowUpNotifications(session: Session): Promise<void> {
  await ensureChannels();
  for (const followUp of session.followUps) {
    if (followUp.dueAt <= Date.now()) continue; // already past, surfaced via in-app banner instead
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: followUp.dueAt,
    };
    await notifee.createTriggerNotification(
      {
        id: `checkin-${session.id}-${followUp.atMinutes}`,
        title: 'How is your pain now?',
        body:
          followUp.atMinutes === 30
            ? 'Quick 1-tap rating — 30 minutes after your Aura session.'
            : 'Quick 1-tap rating — 2 hours after your Aura session.',
        data: { kind: 'checkin', sessionId: session.id, atMinutes: String(followUp.atMinutes) },
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
      },
      trigger,
    );
  }
}

export async function cancelFollowUpNotifications(sessionId: string): Promise<void> {
  await notifee.cancelTriggerNotification(`checkin-${sessionId}-30`);
  await notifee.cancelTriggerNotification(`checkin-${sessionId}-120`);
}

/** Fires immediately — used for the medication-overuse nudge, not scheduled ahead. */
export async function showMedicationOveruseNotification(message: string): Promise<void> {
  await ensureChannels();
  await notifee.displayNotification({
    title: 'Medication use check-in',
    body: message,
    data: { kind: 'moh_warning' },
    android: { channelId: CHANNEL_ID_SAFETY, pressAction: { id: 'default' } },
  });
}

export async function scheduleMidasReminder(fireAt: number): Promise<void> {
  await ensureChannels();
  await notifee.cancelTriggerNotification('midas-reminder');
  const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: fireAt };
  await notifee.createTriggerNotification(
    {
      id: 'midas-reminder',
      title: 'Time for your 3-month MIDAS check-in',
      body: 'A few quick questions to track how migraines are affecting your life.',
      data: { kind: 'midas_reminder' },
      android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
    },
    trigger,
  );
}
