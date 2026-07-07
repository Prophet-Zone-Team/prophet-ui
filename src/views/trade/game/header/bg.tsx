import { useDarkModeEnabled } from "@/store";

export default function Bg() {
  const darkModeEnabled = useDarkModeEnabled();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 453 258"
      fill="none"
      className="h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect
        width="453"
        height="258"
        fill={darkModeEnabled ? "#000000" : "#F5F5F5"}
      />
      <path
        d="M-339 0H1173V238H456L416 258H38L-2 238H-339L-339 0Z"
        fill="black"
      />
    </svg>
  );
}
