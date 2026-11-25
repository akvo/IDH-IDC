import React from "react";
import { SUPPORT_EMAIL } from "./AuthSplitLayout";

// Right column of the sign-up screen: what each Toolkit tool offers and how
// to get access to it
const AdditionalTextBlock = () => (
  <div className="additional-text-block" data-testid="additional-text-block">
    <section className="additional-text-card">
      <h2 className="additional-text-title">Living Income Academy</h2>
      <p className="additional-text-copy">
        Learn how to understand, measure and close living income gaps. Creating
        an account is free and takes a few minutes: fill in your details,
        confirm your email address, and you can start right away.
      </p>
    </section>

    <div className="additional-text-group">
      <section className="additional-text-card">
        <h2 className="additional-text-title">
          Income Driver Calculator
          <span className="additional-text-subtitle">(invitation only)</span>
        </h2>
        <p className="additional-text-copy">
          The Income Driver Calculator is available upon request. To request
          access, send an email to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your
          name, your organisation and what you would like to use the calculator
          for. IDH will get back to you personally to create your account.
        </p>
      </section>
      <p className="additional-text-note">
        An IDC account also gives you access to the Living Income Academy.
        Already have an Academy account? Use the same email address in your
        request, and IDH will add access to the IDC to your existing account.
      </p>
    </div>
  </div>
);

export default AdditionalTextBlock;
