import type { ReferralCategory } from "@/types/referral";
import { CategoryIcon } from "@/views/referral/referral-icons";

interface LandingFooterProps {
  title: string;
  highlight: string;
  categories: ReferralCategory[];
}

export function LandingFooter({ title, highlight, categories }: LandingFooterProps) {
  return (
    <footer className="footer">
      <h2>
        {title}
        <br />
        Global <span>{highlight}</span> next.
      </h2>
      <div className="category-row" aria-label="Future market categories">
        {categories.map((category) => (
          <div key={category.id} className="category">
            <CategoryIcon id={category.id} />
            <span>{category.label}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
