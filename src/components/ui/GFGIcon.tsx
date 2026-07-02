export function GFGIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GeeksForGeeks"
    >
      <rect width="40" height="40" rx="6" fill="#2F8D46" />
      <path
        d="M7 20h5.5M27.5 20H33M12.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5M12.5 20c0 4.1 3.4 7.5 7.5 7.5s7.5-3.4 7.5-7.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
