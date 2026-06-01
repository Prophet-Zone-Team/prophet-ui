import type { ReferralActivityRow } from "@/types/landing";

interface ReferralActivityProps {
  rows: ReferralActivityRow[];
  claimMeta: string;
}

export function ReferralActivity({ rows, claimMeta }: ReferralActivityProps) {
  return (
    <section className="referral-panel activity-card" aria-labelledby="activity-title">
      <h2 className="referral-section-title" id="activity-title">
        Recent Referred Activity
      </h2>
      <div className="activity-table-wrap">
        <table className="activity-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Order ID</th>
              <th>Market</th>
              <th>Order Type</th>
              <th>Order Volume</th>
              <th>Prophet Fee</th>
              <th>Kickback Rate</th>
              <th>Your Reward</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.orderId}>
                <td>{row.user}</td>
                <td className="purple-text">{row.orderId}</td>
                <td>{row.market}</td>
                <td>{row.orderType}</td>
                <td>{row.orderVolume}</td>
                <td>{row.prophetFee}</td>
                <td>{row.kickbackRate}</td>
                <td>{row.reward}</td>
                <td className="status-complete">{row.status}</td>
                <td>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="claim-row">
        <button type="button" className="claim-button">
          Claim Rewards
        </button>
        <span className="claim-meta">{claimMeta}</span>
      </div>
    </section>
  );
}
