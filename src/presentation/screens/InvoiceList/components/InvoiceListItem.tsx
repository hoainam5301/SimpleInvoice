import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Invoice } from '../../../../domain/entities/Invoice';
import { formatCurrency, formatDate } from '../../../../core/utils/formatters';
import { colors, statusColors } from '../../../../core/theme/colors';

interface InvoiceListItemProps {
  invoice: Invoice;
}

function InvoiceListItemBase({ invoice }: InvoiceListItemProps) {
  const status = statusColors[invoice.status];
  return (
    <View style={styles.card} testID={`invoice-item-${invoice.id}`}>
      <View style={styles.left}>
        <Text style={styles.invoiceNumber} numberOfLines={1}>
          {invoice.invoiceNumber}
        </Text>
        <Text style={styles.customerName} numberOfLines={1}>
          {invoice.customerName}
        </Text>
        <Text style={styles.date}>Due {formatDate(invoice.dueDate)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(invoice.amount, invoice.currency)}</Text>
        <View style={[styles.statusPill, { backgroundColor: status.background }]}>
          <Text style={[styles.statusText, { color: status.text }]}>
            {invoice.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Memoized: FlatList re-renders visible rows whenever the list's parent
 * state changes (e.g. `loadMore` toggling a footer spinner) — without
 * `React.memo`, every row would re-render on every page fetch even though
 * only new rows were appended.
 */
export const InvoiceListItem = React.memo(InvoiceListItemBase);

/** Fixed row height consumed by the list's getItemLayout — card 84 + gap 10. */
export const INVOICE_ITEM_HEIGHT = 94;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 84,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  left: { flex: 1, marginRight: 12, justifyContent: 'space-between' },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  invoiceNumber: { fontSize: 15, fontWeight: '700', color: colors.ink },
  customerName: { fontSize: 13.5, color: colors.muted },
  date: { fontSize: 12, color: colors.placeholder },
  amount: { fontSize: 15.5, fontWeight: '700', color: colors.ink },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  statusText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
});
