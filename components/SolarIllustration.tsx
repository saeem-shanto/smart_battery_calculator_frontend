export function SolarIllustration() {
  return (
    <svg className="solar-illustration" viewBox="0 0 360 210" role="img" aria-label="House with rooftop solar panels and battery">
      <circle cx="310" cy="40" r="24" fill="#FDBD3F" />
      <g stroke="#FDBD3F" strokeWidth="5" strokeLinecap="round">
        <path d="M310 5v15M310 60v15M275 40h15M330 40h15M285 15l10 10M325 55l10 10M335 15l-10 10M295 55l-10 10" />
      </g>
      <path d="M80 155h240" stroke="#1a9b4c" strokeWidth="4" strokeLinecap="round" />
      <path d="M145 95l55-48 80 48v60H145z" fill="#eef5fa" stroke="#3273a8" strokeWidth="3" />
      <path d="M130 97l70-58 90 58" fill="none" stroke="#236698" strokeWidth="7" strokeLinecap="round" />
      <rect x="220" y="116" width="28" height="39" fill="#2170a8" />
      <rect x="260" y="112" width="31" height="26" fill="#bfe7fa" stroke="#2370a8" strokeWidth="3" />
      <g transform="translate(198 54) rotate(4)">
        <rect width="71" height="43" rx="2" fill="#1c8ec4" stroke="#0a577f" strokeWidth="2" />
        <path d="M0 14h71M0 28h71M23 0v43M47 0v43" stroke="#73e7ff" strokeWidth="2" />
      </g>
      <rect x="105" y="115" width="49" height="40" rx="6" fill="#f8fbff" stroke="#526b83" strokeWidth="3" />
      <rect x="120" y="123" width="19" height="26" rx="3" fill="#71cf6d" />
      <path d="M126 128h8l-5 8h5l-8 10 2-8h-5z" fill="white" />
      <circle cx="78" cy="123" r="24" fill="#72be31" /><rect x="74" y="124" width="8" height="31" fill="#6b8737" />
      <circle cx="315" cy="125" r="27" fill="#7ac43b" /><rect x="311" y="126" width="8" height="29" fill="#6b8737" />
    </svg>
  );
}
