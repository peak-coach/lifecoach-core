export type SuggestedAction =
  | 'KEEP'
  | 'REVIEW_RAW_FOR_DELETION'
  | 'CHECK_MEETING';

export interface MeetingMeta {
  slug: string;
  baseDir: string;
  lastModified: string;
  hasRaw: boolean;
  hasOut: boolean;
  hasDlq: boolean;
}

export interface RetentionMeetingEntry extends MeetingMeta {
  ageDays: number;
  suggestedAction: SuggestedAction;
}

export interface RetentionReport {
  generatedAt: string;
  meetings: RetentionMeetingEntry[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const determineSuggestedAction = (
  meeting: MeetingMeta,
  ageDays: number,
): SuggestedAction => {
  if (!meeting.hasOut) {
    return 'CHECK_MEETING';
  }

  if (meeting.hasRaw && ageDays > 30) {
    return 'REVIEW_RAW_FOR_DELETION';
  }

  return 'KEEP';
};

const calculateAgeDays = (now: Date, lastModified: string): number => {
  const lastModifiedDate = new Date(lastModified);
  const diffMs = now.getTime() - lastModifiedDate.getTime();
  return Math.floor(diffMs / MS_PER_DAY);
};

export const buildRetentionReport = (
  meetings: MeetingMeta[],
  currentDate: Date = new Date(),
): RetentionReport => {
  const generatedAt = currentDate.toISOString();

  const reportMeetings = meetings.map<RetentionMeetingEntry>((meeting) => {
    const ageDays = calculateAgeDays(currentDate, meeting.lastModified);
    const suggestedAction = determineSuggestedAction(meeting, ageDays);

    return {
      ...meeting,
      ageDays,
      suggestedAction,
    };
  });

  return {
    generatedAt,
    meetings: reportMeetings,
  };
};


