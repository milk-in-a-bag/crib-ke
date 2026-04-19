"use client";
import React from "react";
import { MessageCircleIcon, PhoneIcon, ClockIcon } from "lucide-react";
import { motion } from "framer-motion";
interface ContactPanelProps {
  agent: {
    name: string;
    photo: string;
    responseTime: string;
  };
}
export function ContactPanel({ agent }: ContactPanelProps) {
  const contacts = [
    {
      role: "Property Manager",
      name: agent.name,
      photo: agent.photo,
      responseTime: agent.responseTime,
    },
    {
      role: "Tenant Representative",
      name: "Maria Garcia",
      photo: "https://i.pravatar.cc/150?img=26",
      responseTime: "Within 4 hours",
    },
    {
      role: "Past Occupant",
      name: "James Wilson",
      photo: "https://i.pravatar.cc/150?img=27",
      responseTime: "Within 1 day",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
        Connect with Someone Who Knows
      </h2>
      <p className="text-slate-600 mb-6">
        Get authentic insights from people familiar with this property
      </p>

      <div className="space-y-4 mb-6">
        {contacts.map((contact, index) => (
          <motion.div
            key={contact.role}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: index * 0.1,
            }}
          >
            <div className="flex items-center space-x-4">
              <img
                src={contact.photo}
                alt={contact.name}
                className="w-12 h-12 rounded-full"
              />

              <div>
                <div className="font-semibold text-primary">{contact.name}</div>
                <div className="text-sm text-slate-500">{contact.role}</div>
                <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{contact.responseTime}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 bg-white rounded-lg hover:bg-accent hover:text-white transition-colors border border-slate-200">
                <MessageCircleIcon className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white rounded-lg hover:bg-accent hover:text-white transition-colors border border-slate-200">
                <PhoneIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Quick Message
        </div>
        <textarea
          placeholder="Hi, I'm interested in this property. Can you tell me more about..."
          className="w-full p-3 border border-slate-200 rounded-lg resize-none outline-none focus:border-accent transition-colors"
          rows={3}
        />

        <button className="w-full mt-3 px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors">
          Send Message
        </button>
      </div>
    </div>
  );
}
