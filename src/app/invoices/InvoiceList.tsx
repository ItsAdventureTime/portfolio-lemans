'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge, FormField } from '@/components/ui';
import { formatPeso } from '@/lib/money';
import { hasPermission, ProjectRole } from '@/lib/roles';
import { recordInvoicePayment } from '@/lib/api';
import { Loader2, CreditCard } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  total_cents: number;
  amount_paid_cents: number;
  status: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
  role: ProjectRole;
}

export default function InvoiceList({ invoices, role }: InvoiceListProps) {
  const canPay = hasPermission(role, 'invoiceRecordPayment');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePay(inv: Invoice, formData: FormData) {
    const amount = Number(formData.get('amount'));
    if (Number.isNaN(amount) || amount <= 0) return;
    const amountCents = Math.round(amount * 100);
    const remaining = inv.total_cents - inv.amount_paid_cents;
    if (amountCents > remaining) return;
    startTransition(async () => {
      await recordInvoicePayment(
        inv.id,
        {
          amountCents,
          paymentMethod: String(formData.get('paymentMethod')),
          referenceNo: String(formData.get('referenceNo')),
          paidAt: new Date().toISOString(),
        },
        role
      );
      router.refresh();
    });
  }

  return (
    <DataTable
      items={invoices}
      caption="Invoice and collection list"
      emptyTitle="No invoices yet"
      emptyDescription="Create an invoice from a completed job order."
      columns={[
        {
          key: 'invoiceNo',
          header: 'Invoice No',
          render: (inv) => (
            <Link
              href={`/invoices/${inv.id}`}
              className="inline-flex items-center min-h-11 text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded px-1 -mx-1"
            >
              {inv.invoice_no}
            </Link>
          ),
        },
        { key: 'customer', header: 'Customer', render: (inv) => inv.customer_name },
        { key: 'total', header: 'Total', render: (inv) => formatPeso(inv.total_cents) },
        { key: 'paid', header: 'Paid', render: (inv) => formatPeso(inv.amount_paid_cents) },
        {
          key: 'status',
          header: 'Status',
          render: (inv) => <StatusBadge status={inv.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          render: (inv) =>
            canPay && inv.status !== 'PAID' ? (
              <form
                action={(fd) => handlePay(inv, fd)}
                className="flex flex-wrap items-center gap-2"
              >
                <FormField
                  label=""
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  placeholder="Amount"
                  className="w-28"
                />
                <FormField
                  label=""
                  name="paymentMethod"
                  required
                  placeholder="Method"
                  className="w-28"
                />
                <FormField label="" name="referenceNo" placeholder="Ref" className="w-28" />
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center h-11 px-3 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CreditCard className="h-3 w-3 mr-1" />
                  )}
                  Pay
                </button>
              </form>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
