'use client';

import React from 'react';
import { CheckIcon } from 'lucide-react';

type WorkflowStatus =
  'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'PARTS_PENDING' | 'COMPLETED' | 'BILLED' | 'CLOSED';

interface StatusWorkflowStepperProps {
  status: WorkflowStatus | string;
}

const STEPS: WorkflowStatus[] = [
  'DRAFT',
  'APPROVED',
  'IN_PROGRESS',
  'COMPLETED',
  'BILLED',
  'CLOSED',
];

const statusLabels: Record<WorkflowStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  PARTS_PENDING: 'In Progress',
  COMPLETED: 'Completed',
  BILLED: 'Billed',
  CLOSED: 'Closed',
};

function normalizeStatus(status: string): WorkflowStatus {
  const upper = status.toUpperCase() as WorkflowStatus;
  return STEPS.includes(upper) ? upper : 'DRAFT';
}

export default function StatusWorkflowStepper({ status }: StatusWorkflowStepperProps) {
  const normalized = normalizeStatus(status);
  const activeIndex = STEPS.indexOf(normalized);

  return (
    <div className="w-full">
      <ol className="flex items-center w-full">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <li key={step} className="flex-1 relative">
              {idx > 0 && (
                <div
                  className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 -translate-x-1/2 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold z-10 transition-colors ${
                    isActive
                      ? 'bg-[#d32f2f] border-[#d32f2f] text-white'
                      : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold ${
                    isActive
                      ? 'text-[#d32f2f]'
                      : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                  }`}
                >
                  {statusLabels[step]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
