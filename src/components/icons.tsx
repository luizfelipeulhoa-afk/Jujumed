interface IconProps {
  className?: string;
  strokeWidth?: number;
}

const base = (className?: string) => className ?? "w-5 h-5";

export const IconPulse = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M2 12h4l2.5-6 4 12 2.5-6h7" />
  </svg>
);

export const IconHeartPulse = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M12 20.5S3.5 15.5 3.5 9.2C3.5 6.3 5.7 4.5 8 4.5c1.8 0 3.3 1 4 2.4.7-1.4 2.2-2.4 4-2.4 2.3 0 4.5 1.8 4.5 4.7 0 6.3-8.5 11.3-8.5 11.3Z" />
    <path d="M5 12h3l1.5-3 2.5 5.5L13.5 12H19" />
  </svg>
);

export const IconCheck = ({ className, strokeWidth = 2.4 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const IconCross = ({ className, strokeWidth = 2.4 }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" className={base(className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconStar = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={base(className)}>
    <path d="M12 2.6l2.7 5.9 6.3.7-4.7 4.3 1.3 6.2L12 16.5l-5.6 3.2 1.3-6.2L3 9.2l6.3-.7L12 2.6Z" />
  </svg>
);

export const IconTimer = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={base(className)}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 9.5v4l3 2M9.5 2.5h5M12 2.5V6" />
  </svg>
);

export const IconReset = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M4 5v5h5" />
    <path d="M4.6 10A8 8 0 1 1 4 14.5" />
  </svg>
);

export const IconTarget = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={base(className)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
);

export const IconArrow = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const IconTerminal = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="m6.5 9 3.5 3-3.5 3M12.5 15h5" />
  </svg>
);

export const IconStetho = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M5 3v6a5 5 0 0 0 10 0V3" />
    <path d="M10 14v2.5a4.5 4.5 0 0 0 9 0v-2" />
    <circle cx="19" cy="11.5" r="2.2" />
  </svg>
);

export const IconBook = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" />
  </svg>
);

export const IconChevron = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconFlag = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M5 21V4" />
    <path d="M5 4c4-2.2 7 2.2 11 0v9c-4 2.2-7-2.2-11 0" />
  </svg>
);

export const IconDownload = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={base(className)}>
    <path d="M12 3v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
  </svg>
);
