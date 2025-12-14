import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sampleMeetings from './sample_meetings.json' assert { type: 'json' };
import {
  buildRetentionReport,
  MeetingMeta,
} from './wf5_retention_playground';

const meetings = sampleMeetings as MeetingMeta[];

describe('buildRetentionReport', () => {
  const fixedNow = new Date('2025-12-05T00:00:00Z');
  const expectedAgeDays = (lastModified: string): number =>
    Math.floor((fixedNow.getTime() - new Date(lastModified).getTime()) / (1000 * 60 * 60 * 24));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a report with the same number of meetings and a timestamp', () => {
    const report = buildRetentionReport(meetings);

    expect(report.meetings).toHaveLength(meetings.length);
    expect(report.generatedAt).toBe(fixedNow.toISOString());
    expect(new Date(report.generatedAt).toString()).not.toBe('Invalid Date');
  });

  it('computes ageDays and suggestedAction according to the retention rules', () => {
    const report = buildRetentionReport(meetings);

    const legacy = report.meetings.find((m) => m.slug.includes('Legacy Session'));
    expect(legacy?.ageDays).toBe(expectedAgeDays('2025-10-01T12:00:00Z'));
    expect(legacy?.suggestedAction).toBe('REVIEW_RAW_FOR_DELETION');

    const noRaw = report.meetings.find((m) => m.slug.includes('No Raw Output Check'));
    expect(noRaw?.ageDays).toBe(expectedAgeDays('2025-11-25T09:15:00Z'));
    expect(noRaw?.suggestedAction).toBe('KEEP');

    const missingOut = report.meetings.find((m) => m.slug.includes('Missing Output'));
    expect(missingOut?.ageDays).toBe(expectedAgeDays('2025-11-28T16:45:00Z'));
    expect(missingOut?.suggestedAction).toBe('CHECK_MEETING');

    const dlqMeeting = report.meetings.find((m) => m.slug.includes('DLQ Present'));
    expect(dlqMeeting?.hasDlq).toBe(true);
    expect(dlqMeeting?.ageDays).toBe(expectedAgeDays('2025-10-15T08:00:00Z'));
    expect(dlqMeeting?.suggestedAction).toBe('REVIEW_RAW_FOR_DELETION');
  });
});


