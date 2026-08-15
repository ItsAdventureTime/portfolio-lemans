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
  'PARTS_PENDING',
  'COMPLETED',
  'BILLED',
  'CLOSED',
];

const statusLabels: Record<WorkflowStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  PARTS_PENDING: 'Parts Pending',
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
    <div
      className="workflow-stepper w-full"
      role="group"
      aria-label={`Job order status: ${statusLabels[normalized]}`}
      tabIndex={0}
    >
      <ol className="workflow-stepper-track items-start" aria-label="Job order status stages">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;

          return (
            <li
              key={step}
              className="workflow-step"
              aria-current={isActive ? 'step' : undefined}
              aria-label={`${isActive ? 'Current' : isCompleted ? 'Completed' : 'Upcoming'}: ${statusLabels[step]}`}
            >
              {idx > 0 && (
                <div
                  className={`workflow-step-connector ${isCompleted ? 'workflow-step-connector-complete' : ''}`}
                  aria-hidden="true"
                />
              )}
              <div className="relative flex flex-col items-center">
                <div
                  className={`workflow-step-node transition-colors ${
                    isActive
                      ? 'workflow-step-node-current'
                      : isCompleted
                        ? 'workflow-step-node-completed'
                        : 'workflow-step-node-upcoming'
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : idx + 1}
                </div>
                <span
                  className={`workflow-step-label ${
                    isActive
                      ? 'workflow-step-label-current'
                      : isCompleted
                        ? 'workflow-step-label-completed'
                        : 'workflow-step-label-upcoming'
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
