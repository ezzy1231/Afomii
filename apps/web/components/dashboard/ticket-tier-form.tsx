"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type TicketTier = {
  id: string;
  name: string;
  tier: string;
  price: string;
  totalQuantity: string;
  salesStart: string;
  salesEnd: string;
};

type Props = {
  tiers: TicketTier[];
  onChange: (tiers: TicketTier[]) => void;
};

export function TicketTierManager({ tiers, onChange }: Props) {
  function addTier() {
    const newTier: TicketTier = {
      id: crypto.randomUUID(),
      name: "",
      tier: "GENERAL",
      price: "",
      totalQuantity: "",
      salesStart: "",
      salesEnd: "",
    };
    onChange([...tiers, newTier]);
  }

  function updateTier(id: string, field: keyof TicketTier, value: string) {
    onChange(
      tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }

  function removeTier(id: string) {
    onChange(tiers.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-app-fg">Ticket Tiers</h3>
        <Button variant="accent" size="sm" onClick={addTier}>
          + Add Tier
        </Button>
      </div>

      {tiers.length === 0 && (
        <p className="text-sm text-app-muted text-center py-8">
          No ticket tiers yet. Add at least one tier.
        </p>
      )}

      {tiers.map((tier) => (
        <Card key={tier.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ticket Tier</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeTier(tier.id)}
              >
                Remove
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Tier Name
                </label>
                <Input
                  placeholder="e.g., General Admission"
                  value={tier.name}
                  onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Tier Type
                </label>
                <Select
                  value={tier.tier}
                  onChange={(e) => updateTier(tier.id, "tier", e.target.value)}
                >
                  <option value="GENERAL">General Admission</option>
                  <option value="VIP">VIP</option>
                  <option value="EARLY_BIRD">Early Bird</option>
                  <option value="GROUP">Group Pax</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Price (ETB)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={tier.price}
                  onChange={(e) => updateTier(tier.id, "price", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Total Quantity
                </label>
                <Input
                  type="number"
                  placeholder="500"
                  value={tier.totalQuantity}
                  onChange={(e) =>
                    updateTier(tier.id, "totalQuantity", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Sales Start
                </label>
                <Input
                  type="datetime-local"
                  value={tier.salesStart}
                  onChange={(e) =>
                    updateTier(tier.id, "salesStart", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-fg">
                  Sales End
                </label>
                <Input
                  type="datetime-local"
                  value={tier.salesEnd}
                  onChange={(e) =>
                    updateTier(tier.id, "salesEnd", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
