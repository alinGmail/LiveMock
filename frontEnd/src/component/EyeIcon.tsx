/**
 * Password reveal icon. `off` draws a slash through the eye for the "hide"
 * state.
 */
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off ? <path d="M3 3l18 18" /> : null}
  </svg>
);

export default EyeIcon;
