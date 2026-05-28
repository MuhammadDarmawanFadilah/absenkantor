"use client";

import React from 'react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors
                  ${currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                  }`}
              >
                {step.id}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-px bg-gray-300 mx-4 mt-[-20px]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
