import React, { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { Check, Shield, Star, Rocket, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';
import './Billing.css';

interface Plan {
  id: number;
  name: string;
  price: number;
  max_documents: number;
  max_messages: number;
}

export const BillingPage: React.FC = () => {
  const { activeBusiness, refreshBusinesses, loading: contextLoading } = useBusiness();
  const { getAccessToken, isAuthenticated, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [botName, setBotName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      if (authLoading || !isAuthenticated) return;

      try {
        const token = await getAccessToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/plans/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, [getAccessToken, isAuthenticated, authLoading]);


  const openNamingModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setBotName(activeBusiness?.name || '');
    setIsModalOpen(true);
  };

  const handleFinalSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !botName.trim()) return;

    setIsSubmitting(true);
    const token = await getAccessToken();
    const loadingToast = toast.loading(`Preparing payment for ${selectedPlan.name}...`);

    try {
      const response = await fetch(`/api/create-razorpay-order/?plan_id=${selectedPlan.id}&bot_name=${encodeURIComponent(botName)}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.detail || "Error creating order");
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SocialLink",
        description: `${selectedPlan.name} Plan - ${botName}`,
        order_id: orderData.order_id,
        handler: async function (rzpResponse: any) {
          toast.success("Payment successful! Verifying...", { id: loadingToast });
          
          try {
            const freshToken = await getAccessToken();
            const verifyRes = await fetch('/api/verify-razorpay-payment/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${freshToken}`
              },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                plan_id: selectedPlan.id,
                bot_name: botName
              })
            });

            if (verifyRes.ok) {
              toast.success("Subscription activated!", { id: loadingToast });
              await refreshBusinesses();
              setIsModalOpen(false);
            } else {
              const errorData = await verifyRes.json();
              toast.error(errorData.detail || "Verification failed", { id: loadingToast });
            }
          } catch (err) {
            toast.error("Verification connection error", { id: loadingToast });
          }
        },
        prefill: {
          name: orderData.user.name,
          email: orderData.user.email,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
      toast.dismiss(loadingToast);
    } catch (err: any) {
      toast.error(err.message || "Network error. Please try again.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (contextLoading || isLoading) return <div className="loading-state"><Loader2 className="spin" /> <span>Syncing Plans...</span></div>;

  return (
    <div className="billing-container">
      <header className="page-header">
        <div className="header-info">
          <h1>Plans & Subscriptions</h1>
          <p>Choose a plan to power your SocialLink assistant.</p>
        </div>
      </header>

      <div className="pricing-selector">
        <div className="billing-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`billing-card ${plan.name === 'Pro' ? 'recommended' : ''}`}>
              <div className="plan-icon">
                {plan.name === 'Starter' && <Rocket size={24} />}
                {plan.name === 'Pro' && <Star size={24} />}
                {plan.name === 'Enterprise' && <Shield size={24} />}
              </div>
              <h3>{plan.name}</h3>
              <div className="billing-price">${plan.price}<span>/mo</span></div>
              <ul className="billing-features">
                <li><Check size={16} color="var(--primary)" /> {plan.max_messages.toLocaleString()} Messages</li>
                <li><Check size={16} color="var(--primary)" /> {plan.max_documents} Docs</li>
                <li><Check size={16} color="var(--primary)" /> Full WhatsApp API</li>
              </ul>
              <button className="upgrade-btn" onClick={() => openNamingModal(plan)}>
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Activate ${selectedPlan?.name}`}>
        <form onSubmit={handleFinalSubscribe} className="modal-form">
          <div className="form-group">
            <label>Name your AI Bot</label>
            <input 
              type="text" 
              value={botName} 
              onChange={e => setBotName(e.target.value)} 
              placeholder="e.g. My Support Bot"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border)', marginTop: '0.5rem' }}
              required 
            />
          </div>
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'none' }}>
            <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>Confirm</button>
          </div>
        </form>
      </Modal>

      <style>{`.modal-form { display: flex; flex-direction: column; gap: 1.5rem; }`}</style>
    </div>
  );
};
