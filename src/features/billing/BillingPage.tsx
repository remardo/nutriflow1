
import React from 'react';
import './BillingPage.css';
import { Card } from '../../components/Card/Card';
import { fetchBillingPlan, BillingPlanDto } from '../../api/billing';

export const BillingPage: React.FC = () => {
  const [plan, setPlan] = React.useState<BillingPlanDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBillingPlan();
        if (mounted) {
          setPlan(data);
        }
      } catch (_e) {
        if (mounted) {
          setError('Не удалось загрузить информацию о тарифе');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="BillingPageRoot">
      <Card
        title={plan ? `Тариф: ${plan.name}` : 'Тарифный план'}
        subtitle="Данные из /api/billing/plan"
      >
        {loading && (
          <div className="BillingPage-plan">Загрузка тарифа...</div>
        )}
        {error && (
          <div className="BillingPage-error">{error}</div>
        )}
        {!loading && !error && plan && (
          <div className="BillingPage-plan">
            <div className="BillingPage-plan-name">{plan.name}</div>
            <div className="BillingPage-plan-desc">
              Максимум {plan.maxClients} активных клиентов.
            </div>
            {plan.features && plan.features.length > 0 && (
              <ul className="BillingPage-plan-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            <div className="BillingPage-plan-note">
              Это демонстрационный вывод: реальный биллинг и оплата
              интегрируются во внешнем сервисе.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
