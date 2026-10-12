import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { formatPrice } from '../../utils/formatPrice';

export default function OrderCard({ order }) {
  const shortId = order._id ? order._id.slice(-8).toUpperCase() : '';
  const dateFormatted = order.createdAt
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(order.createdAt))
    : '';

  const items = order.items || [];
  const previewThumbnails = items.slice(0, 4);
  const remainingCount = items.length - 4;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return 'bg-accent/20 text-accent border-accent/30';
      case 'CONFIRMED':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'SHIPPED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DELIVERED':
        return 'bg-success/20 text-success border-success/30';
      default:
        return 'bg-glass/[0.08] text-muted border-glass-border/[0.14]';
    }
  };

  return (
    <GlassCard
      variant="default"
      padding="default"
      hoverLift
      className="order-card-reveal text-left h-full flex flex-col justify-between space-y-5 group"
    >
      {/* Header: Short ID + Date + Status Pill */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">
              Order #{shortId}
            </span>
            <span className="text-xs text-muted block mt-0.5">{dateFormatted}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide select-none ${getStatusBadge(
              order.status
            )}`}
          >
            {order.status}
          </span>
        </div>

        {/* Overlapping Stacked Item Thumbnails */}
        <div className="flex items-center pt-2">
          <div className="flex items-center -space-x-3 overflow-hidden">
            {previewThumbnails.map((item, idx) => (
              <div
                key={item.product || idx}
                className="w-10 h-10 rounded-xl bg-glass/[0.08] border-2 border-bg-elevated overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
                title={`${item.name} (${item.quantity})`}
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-4 h-4 text-muted" />
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-10 h-10 rounded-xl bg-glass/[0.12] border-2 border-bg-elevated flex items-center justify-center shrink-0 text-[11px] font-semibold text-primary shadow-sm">
                +{remainingCount}
              </div>
            )}
          </div>
        </div>

        {/* First 2 item lines text */}
        <div className="space-y-1 pt-1 text-xs">
          {items.slice(0, 2).map((item, idx) => (
            <p key={item.product || idx} className="text-primary truncate font-medium">
              <span>{item.name}</span>{' '}
              <span className="text-muted tabular-nums font-normal">× {item.quantity}</span>
            </p>
          ))}
          {items.length > 2 && (
            <p className="text-[11px] text-muted font-normal">
              +{items.length - 2} more {items.length - 2 === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>
      </div>

      {/* Footer: Server total & View Details Link */}
      <div className="pt-4 border-t border-glass-border/[0.08] flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted block">Total</span>
          <span className="text-base font-bold text-primary tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        <Link
          to={`/orders/${order._id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-glass/[0.08] hover:bg-glass/[0.16] text-primary border border-glass-border/[0.14] transition-all group-hover:border-accent/40"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </GlassCard>
  );
}
