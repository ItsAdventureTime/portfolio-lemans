'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, StatusBadge, FormField } from '@/components/ui';
import { formatPeso, parsePesoToCents } from '@/lib/money';
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
    const amountCents = parsePesoToCents(String(formData.get('amount') ?? ''));
    if (amountCents === null || amountCents <= 0) return;
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
          widthClass: 'w-[18%]',
          className: 'tabular-nums',
          render: (inv) => (
            <Link
              href={`/invoices/${inv.id}`}
              className="inline-flex min-h-11 max-w-full items-center break-all rounded px-1 -mx-1 font-medium tabular-nums text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 sm:break-normal"
            >
              {inv.invoice_no}
            </Link>
          ),
        },
        {
          key: 'customer',
          header: 'Customer',
          widthClass: 'w-[22%]',
          className: 'hidden sm:table-cell',
          render: (inv) => inv.customer_name,
        },
        {
          key: 'total',
          header: 'Total',
          widthClass: 'w-[14%]',
          numeric: true,
          render: (inv) => formatPeso(inv.total_cents),
        },
        {
          key: 'paid',
          header: 'Paid',
          widthClass: 'w-[14%]',
          className: 'hidden sm:table-cell',
          numeric: true,
          render: (inv) => formatPeso(inv.amount_paid_cents),
        },
        {
          key: 'status',
          header: 'Status',
          widthClass: 'w-[14%]',
          align: 'center',
          render: (inv) => <StatusBadge status={inv.status} />,
        },
        {
          key: 'actions',
          header: 'Actions',
          widthClass: 'w-[18%]',
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
