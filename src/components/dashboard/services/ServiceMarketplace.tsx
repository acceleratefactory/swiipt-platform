"use client";

import { useState } from "react";
import ServiceCard from "./ServiceCard";
import OrderFlow from "./OrderFlow";
import CreateGroupBuyModal from "@/components/dashboard/groups/CreateGroupBuyModal";

interface ServicePackage {
  id: string;
  category: string;
  destination: string;
  name: string;
  short_description: string;
  full_description: string;
  price_ngn: number;
  price_usd: number;
  price_aed: number;
  price_qar: number;
  price_gbp: number;
  processing_weeks_min: number | null;
  processing_weeks_max: number | null;
  is_active: boolean;
  is_featured: boolean;
  badge_text: string | null;
  sort_order: number;
}

interface ActiveGoal {
  id: string;
  goal_name: string;
  current_balance: number;
  currency: string;
  milestone_100_unlocked: boolean;
  status: string;
}

interface ExistingOrder {
  package_id: string;
  status: string;
}

interface ServiceMarketplaceProps {
  packages: ServicePackage[];
  preferredCurrency: string;
  mobilityScore: number;
  activeGoals: ActiveGoal[];
  existingOrders: ExistingOrder[];
  userId: string;
  walletCredits?: number;
}

const categories = [
  { value: "all", label: "All services" },
  { value: "residency_permit", label: "Residency Permits" },
  { value: "work_visa", label: "Work Visas" },
  { value: "remote_work_visa", label: "Remote Work" },
  { value: "second_citizenship", label: "2nd Citizenship" },
  { value: "company_registration", label: "Company Setup" },
  { value: "relocation_concierge", label: "Concierge" },
  { value: "landing_package", label: "Landing Package" },
  { value: "diaspora_services", label: "Diaspora" },
];

export default function ServiceMarketplace({
  packages,
  preferredCurrency,
  mobilityScore: _mobilityScore,
  activeGoals,
  existingOrders,
  userId,
  walletCredits = 0,
}: ServiceMarketplaceProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [groupBuyPackage, setGroupBuyPackage] = useState<ServicePackage | null>(null);

  const filtered = activeCategory === "all"
    ? packages
    : packages.filter(p => p.category === activeCategory);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
          Services
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Fixed pricing. Defined timelines. We handle everything.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: activeCategory === cat.value ? '2px solid var(--teal)' : '1px solid var(--border)',
              background: activeCategory === cat.value ? 'var(--teal-pale)' : 'white',
              color: activeCategory === cat.value ? 'var(--teal)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: activeCategory === cat.value ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {filtered.map(pkg => {
          const existingOrder = existingOrders.find(o => o.package_id === pkg.id);
          return (
            <ServiceCard
              key={pkg.id}
              pkg={pkg}
              preferredCurrency={preferredCurrency}
              existingOrder={existingOrder}
              activeGoals={activeGoals}
              onSelect={() => setSelectedPackage(pkg)}
              onGroupBuy={() => setGroupBuyPackage(pkg)}
            />
          );
        })}
      </div>

      {selectedPackage && (
        <OrderFlow
          pkg={selectedPackage}
          preferredCurrency={preferredCurrency}
          activeGoals={activeGoals}
          userId={userId}
          walletCredits={walletCredits}
          onClose={() => setSelectedPackage(null)}
          onOrderPlaced={() => {
            setSelectedPackage(null);
            window.location.reload();
          }}
        />
      )}

      {groupBuyPackage && (
        <CreateGroupBuyModal
          itemType="service"
          itemId={groupBuyPackage.id}
          itemTitle={groupBuyPackage.name}
          originalPrice={groupBuyPackage.price_ngn}
          onClose={() => setGroupBuyPackage(null)}
        />
      )}
    </div>
  );
}
