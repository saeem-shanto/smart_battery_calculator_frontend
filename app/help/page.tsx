import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/JsonLd";

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Does this calculator automatically find the optimal battery capacity?", acceptedAnswer: { "@type": "Answer", text: "No. The current client-supplied batt_cal_v1 model evaluates the battery capacity selected in Step 2. It does not search for the optimal capacity." } },
    { "@type": "Question", name: "How are solar and household data prepared?", acceptedAnswer: { "@type": "Answer", text: "Use an Australian postcode and 24 hourly consumption readings to request a 365-day dataset, with location-based solar production obtained server-side from Renewables.ninja; alternatively upload a validated annual workbook." } },
    { "@type": "Question", name: "Can I change the electricity tariff?", acceptedAnswer: { "@type": "Answer", text: "Yes. Step 2 supports a 24-hour retail import price schedule and a separate 24-hour solar feed-in tariff schedule. The prefilled values come from the supplied client script and are not guaranteed to match a household's electricity plan." } },
    { "@type": "Question", name: "What installation cost should I enter?", acceptedAnswer: { "@type": "Answer", text: "Step 3 accepts the total financed installation cost in AUD, together with an annual interest rate, loan period and daily supply charge. It is not a battery cost per kWh input." } },
    { "@type": "Question", name: "Why is my result not saved?", acceptedAnswer: { "@type": "Answer", text: "The current updated-model workflow processes calculations transiently; download the returned result CSV before navigating away. Availability of retained results depends on backend version." } },
    { "@type": "Question", name: "Could not reach the Django backend", acceptedAnswer: { "@type": "Answer", text: "Check that Django is online, NEXT_PUBLIC_API_BASE_URL points to the correct HTTPS backend API, and Django CORS allows the frontend origin." } },
  ],
};

export default function HelpPage() {
  return <>
    <JsonLd data={faqData} />
    <AppShell>
      <div className="page-header"><h1>Help</h1><p>Complete a calculation with the updated client MATLAB model, batt_cal_v1.</p></div>
      <div className="notice page-card-space"><strong>Current calculation mode:</strong>&nbsp; Evaluate a <strong>selected battery capacity</strong>. The research publications discuss optimal sizing, but this version of the client-supplied script does not optimise the battery size for you.</div>
      <div className="help-grid">
        <section className="info-card"><div className="help-step-label">Step 1</div><h2>Choose your input method</h2><p>Enter an Australian postcode and 24 hourly electricity-consumption values (kWh), or upload a supported annual XLS/XLSX/CSV/TXT workbook. On the postcode pathway, Django requests location-based PV data from Renewables.ninja and prepares the annual profile.</p></section>
        <section className="info-card"><div className="help-step-label">Step 1</div><h2>Review solar and time assumptions</h2><p>The 24 input hours represent a typical day repeated across a 365-day simulation year. Choose the historical weather year, panel tilt and orientation. For leap years, the backend prepares the agreed 8,760-hour series. Postcode determines the solar location; suburb is optional record information.</p></section>
        <section className="info-card"><div className="help-step-label">Step 2</div><h2>Choose battery and PV capacities</h2><p>Set the battery capacity in kWh and solar PV capacity in kW you want to evaluate. The supplied script's example defaults are 15 kWh and 6 kW. These are editable inputs, not an optimisation search range.</p></section>
        <section className="info-card"><div className="help-step-label">Step 2</div><h2>Enter hourly electricity tariffs</h2><p>Edit the 24 hourly retail import rates and 24 hourly feed-in rates in AUD/kWh, or retain the example values supplied with the client model. Rates can differ by hour. The Tariff Library is reference-only and does not automatically set these inputs.</p></section>
        <section className="info-card"><div className="help-step-label">Step 3</div><h2>Enter total cost and financing</h2><p>Enter your total installation cost in AUD, annual interest rate (%), loan period (years) and daily electricity supply charge (AUD/day). The updated MATLAB model uses this total-cost assumption in its annual financing calculation; it is not an independent cost-per-kWh payback field.</p></section>
        <section className="info-card"><div className="help-step-label">Step 4</div><h2>Run and interpret the result</h2><p>Django validates the inputs and executes the client-provided MATLAB calculation using GNU Octave. Review the selected battery capacity, annual payment, grid imports/exports and any warnings. Download the result CSV before leaving a private transient calculation.</p></section>
        <section className="info-card"><div className="help-step-label">Model scope</div><h2>Know what is being evaluated</h2><p>The current model estimates annual costs for the user-selected configuration. It is not a guarantee of electricity-bill savings or a complete representation of every demand-charge and energy-management strategy in the client's published studies.</p></section>
        <section className="info-card"><div className="help-step-label">Privacy</div><h2>Data and account handling</h2><p>The current updated calculation pathway uses transient processing. Other account and history features may be available for older retained records. Avoid uploading identifiable household information unnecessarily; download any transient results you need to keep.</p></section>
      </div>
      <section className="card page-card-space help-troubleshooting">
        <div className="card-header"><div><h2>Common issues</h2><p className="admin-card-subtitle">Checks before retrying a calculation.</p></div></div>
        <div className="help-faq-list">
          <details><summary>“Could not reach the Django backend”</summary><p>Confirm the deployed API is online and your Vercel NEXT_PUBLIC_API_BASE_URL environment variable points to the correct Django HTTPS origin. Check CORS for the deployed frontend domain.</p></details>
          <details><summary>The annual workbook is rejected</summary><p>Use a supported file format and the agreed input columns. Review the specific validation error. The supplied client model expects annual PV and load profiles at compatible intervals.</p></details>
          <details><summary>The calculation engine returns an error</summary><p>Check that the backend deployment includes the updated batt_cal_v1 adapter, GNU Octave and the same input contract as this frontend. Keep the current browser draft and retry after the issue is resolved.</p></details>
          <details><summary>The result disappeared</summary><p>Transient calculations are not permanently saved by the updated-model pathway. Download the canonical CSV immediately after a successful calculation.</p></details>
        </div>
      </section>
      <div className="notice page-card-space"><strong>Research prototype:</strong>&nbsp; Outputs depend on historical PV data, user inputs, tariff assumptions and the supplied client model. They are not a substitute for individual financial or electrical engineering advice.</div>
    </AppShell>
  </>;
}
