import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/JsonLd";

export default function HelpPage(){
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Could not reach the Django backend", acceptedAnswer: { "@type": "Answer", text: "Confirm the backend service is online, the production frontend API URL points to the correct HTTPS Django origin, and that Django CORS allows this frontend origin." } },
      { "@type": "Question", name: "Workbook validation fails", acceptedAnswer: { "@type": "Answer", text: "Use one of the supported file types and make sure the first two columns contain numeric PV and load values for the required annual profile. The validation message should identify the issue before calculation starts." } },
      { "@type": "Question", name: "The calculation engine returns an error", acceptedAnswer: { "@type": "Answer", text: "If the workbook passed validation, the failure occurred while the backend calculation engine was running. Your browser keeps the current draft so you can retry without uploading the file again." } },
      { "@type": "Question", name: "A transient result disappeared", acceptedAnswer: { "@type": "Answer", text: "Transient results are not retained by the backend. The current browser tab caches the immediate response, but you should download the canonical CSV before leaving if you need a copy." } },
      { "@type": "Question", name: "Account calculations are temporarily unavailable", acceptedAnswer: { "@type": "Answer", text: "A backend outage does not automatically clear the browser session. Retry when the backend is available; guest records stored in this browser remain accessible separately." } }
    ]
  };
  return <>
    <JsonLd data={faqData} />
    <AppShell>
    <div className="page-header"><h1>Help</h1><p>How to run, understand, and manage a Smart Battery Calculator result.</p></div>

    <div className="help-grid">
      <section className="info-card"><div className="help-step-label">Step 1</div><h2>Upload annual data</h2><p>Select an XLS, XLSX, CSV or TXT file. Column 1 is the base PV profile and column 2 is household load. The file is validated before you can continue.</p></section>
      <section className="info-card"><div className="help-step-label">Step 1</div><h2>Add optional record information</h2><p>Postcode, suburb and state help identify retained calculations later. They do not change the optimisation.</p></section>
      <section className="info-card"><div className="help-step-label">Step 2</div><h2>Review locked assumptions</h2><p>The PV size, retail price, feed-in tariff, battery annual rate and search range come directly from the unchanged client MATLAB source and are intentionally not editable.</p></section>
      <section className="info-card"><div className="help-step-label">Step 3</div><h2>Enter installed battery cost</h2><p>The installed cost per kWh is used only for the displayed simple-payback calculation. It does not change the optimisation objective.</p></section>
      <section className="info-card"><div className="help-step-label">Privacy</div><h2>Choose whether to save</h2><p>If retention is off, Django/Octave processes the request transiently and returns the result without keeping a calculation/file record. If retention is on, the input and canonical result CSV are retained.</p></section>
      <section className="info-card"><div className="help-step-label">Access</div><h2>Guest or account</h2><p>Guests revisit retained calculations using a private token stored in that browser. Signed-in users automatically own new retained calculations and can access them through their account.</p></section>
      <section className="info-card"><div className="help-step-label">Access</div><h2>Claim a guest record</h2><p>After signing in, My Calculations can attach an eligible retained guest calculation from this browser to your account. Account access then replaces the old guest-token access.</p></section>
      <section className="info-card"><div className="help-step-label">Results</div><h2>Download results</h2><p>Retained calculations expose the stored input and canonical result CSV. Transient calculations provide the canonical CSV only in the immediate result response, so download it before leaving.</p></section>
    </div>

    <section className="card page-card-space help-troubleshooting">
      <div className="card-header"><div><h2>Common issues</h2><p className="admin-card-subtitle">Quick checks before you retry or report a problem.</p></div></div>
      <div className="help-faq-list">
        <details><summary>“Could not reach the Django backend”</summary><p>Confirm the backend service is online, the production frontend API URL points to the correct HTTPS Django origin, and that Django CORS allows this frontend origin.</p></details>
        <details><summary>Workbook validation fails</summary><p>Use one of the supported file types and make sure the first two columns contain numeric PV and load values for the required annual profile. The validation message should identify the issue before calculation starts.</p></details>
        <details><summary>The calculation engine returns an error</summary><p>If the workbook passed validation, the failure occurred while the backend calculation engine was running. Your browser keeps the current draft so you can retry without uploading the file again.</p></details>
        <details><summary>A transient result disappeared</summary><p>Transient results are not retained by the backend. The current browser tab caches the immediate response, but you should download the canonical CSV before leaving if you need a copy.</p></details>
        <details><summary>Account calculations are temporarily unavailable</summary><p>A backend outage does not automatically clear the browser session. Retry when the backend is available; guest records stored in this browser remain accessible separately.</p></details>
      </div>
    </section>

    <div className="notice page-card-space"><strong>Research tool:</strong>&nbsp; Outputs are decision-support estimates produced from the supplied algorithm and input data. They are not financial, electrical-installation, or engineering advice.</div>
    </AppShell>
  </>;
}
