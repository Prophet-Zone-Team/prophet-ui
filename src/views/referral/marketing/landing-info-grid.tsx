import type { ReferralMarketingContent } from "@/types/referral";
import {
  MessageStepIcon,
  PlayStepIcon,
  SignalTaxonomyIcon,
  TargetStepIcon,
  WhyItemIcon,
} from "@/views/referral/referral-icons";

const stepIcons = [TargetStepIcon, MessageStepIcon, PlayStepIcon] as const;

interface LandingInfoGridProps {
  workSteps: ReferralMarketingContent["workSteps"];
  signalTaxonomy: ReferralMarketingContent["signalTaxonomy"];
  whyItems: ReferralMarketingContent["whyItems"];
}

export function LandingInfoGrid({ workSteps, signalTaxonomy, whyItems }: LandingInfoGridProps) {
  return (
    <section className="info-grid" aria-label="Prophet explanation and signals">
      <div className="panel">
        <h2 className="panel-title">How Prophet Works</h2>
        <div className="work-steps">
          {workSteps.map((step, index) => {
            const StepIcon = stepIcons[index] ?? TargetStepIcon;
            return (
              <article key={step.number} className="step">
                <div className="step-icon">
                  <StepIcon />
                </div>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Market Signals</h2>
        <div className="signals-grid">
          {signalTaxonomy.map((signal) => (
            <div key={signal.id} className="signal">
              <SignalTaxonomyIcon id={signal.id} />
              <span>{signal.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Why Prophet</h2>
        <div className="why-list">
          {whyItems.map((item) => (
            <article key={item.id} className="why-item">
              <WhyItemIcon id={item.id} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
