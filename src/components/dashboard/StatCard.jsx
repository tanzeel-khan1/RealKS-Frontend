import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeLabel, icon: Icon, index = 0 }) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3">
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
          )}
          <span className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel || 'vs last month'}</span>
        </div>
      )}
    </motion.div>
  );
}