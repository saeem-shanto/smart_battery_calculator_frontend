import { AppShell } from "@/components/AppShell";

export default function HelpPage(){
  return <AppShell>
    <div className="page-header"><h1>Help</h1><p>How to run and manage a Smart Battery Calculator result.</p></div>
    <div className="help-grid">
      <section className="info-card"><h2>1. Upload annual data</h2><p>Select an XLS, XLSX, CSV or TXT file. The production client workflow uses column 1 as the base PV profile and column 2 as household load.</p></section>
      <section className="info-card"><h2>2. Add record information</h2><p>Postcode, suburb and state are optional calculation-record fields that help administrators search the audit table. They do not change the optimisation.</p></section>
      <section className="info-card"><h2>3. Review locked assumptions</h2><p>The PV size, retail price, feed-in tariff, battery annual rate and search range come directly from the unchanged client MATLAB source.</p></section>
      <section className="info-card"><h2>4. Enter installed battery cost</h2><p>The installed cost per kWh is used only for the displayed simple-payback calculation. It does not change the optimisation objective.</p></section>
      <section className="info-card"><h2>5. Choose privacy and run</h2><p>If retention is off, Django/Octave processes the request transiently and returns the result without keeping a calculation or file record. If retention is on, the calculation and canonical CSV are retained.</p></section>
      <section className="info-card"><h2>6. Guest or account access</h2><p>Guests revisit retained calculations using a private token stored only in that browser. Signed-in users automatically own new retained calculations and can access them through their account.</p></section>
      <section className="info-card"><h2>7. Claim a guest record</h2><p>After signing in, My Calculations can attach an eligible retained guest calculation from this browser to your account. Once claimed, account access replaces the old guest-token access.</p></section>
      <section className="info-card"><h2>8. Download results</h2><p>Retained calculations expose the stored input and canonical result CSV. Transient calculations provide the canonical CSV only in the immediate result response, so download it before leaving.</p></section>
    </div>
    <div className="notice"><strong>Research tool:</strong>&nbsp; Outputs are decision-support estimates produced from the supplied algorithm and input data. They are not financial, electrical-installation, or engineering advice.</div>
  </AppShell>;
}
