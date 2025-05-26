import type { SVGProps } from 'react';

export function SheetsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 2H9C7.89543 2 7 2.89543 7 4V20C7 21.1046 7.89543 22 9 22H15C16.1046 22 17 21.1046 17 20V4C17 2.89543 16.1046 2 15 2Z" />
      <path d="M7 7H17" />
      <path d="M7 12H17" />
      <path d="M7 17H12" />
    </svg>
  );
}
