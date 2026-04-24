"use client";
import React from "react";
import { ClockIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ContactForm } from "@/components/ContactForm";

interface ContactPanelProps {
  agent: {
    name: string;
    photo: string;
    responseTime: string;
  };
  propertyId: string;
}

export function ContactPanel({
  agent,
  propertyId,
}: Readonly<ContactPanelProps>) {
  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
        Connect with Someone Who Knows
      </h2>
      <p className="text-slate-600 mb-6">
        Get authentic insights from people familiar with this property
      </p>

      {/* Agent card */}
      <motion.div
        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center space-x-4">
          <img
            src={agent.photo}
            alt={agent.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <div className="font-semibold text-primary">{agent.name}</div>
            <div className="text-sm text-slate-500">Property Manager</div>
            <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
              <ClockIcon className="w-3 h-3" />
              <span>{agent.responseTime}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact form */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Quick Message
        </div>
        <ContactForm propertyId={propertyId} />
      </div>
    </div>
  );
}
