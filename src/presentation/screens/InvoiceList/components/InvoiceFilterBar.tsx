import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { INVOICE_SORT_FIELDS, INVOICE_STATUSES } from '../../../../core/constants/app.constants';
import { colors } from '../../../../core/theme/colors';
import { GradientSurface } from '../../../components/common/GradientSurface';
import type { InvoiceSortField, InvoiceStatus, SortDirection } from '../../../../domain/entities/Invoice';

interface InvoiceFilterBarProps {
  status: InvoiceStatus | undefined;
  onStatusChange: (status: InvoiceStatus | undefined) => void;
  sortBy: InvoiceSortField;
  sortDirection: SortDirection;
  onSortChange: (field: InvoiceSortField) => void;
}

const SORT_LABELS: Record<InvoiceSortField, string> = {
  createdDate: 'Created',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  amount: 'Amount',
};

/** Status + sort chip rows. The search input lives in the screen header. */
export function InvoiceFilterBar({
  status,
  onStatusChange,
  sortBy,
  sortDirection,
  onSortChange,
}: InvoiceFilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        <Chip
          label="All"
          selected={status === undefined}
          onPress={() => onStatusChange(undefined)}
          testID="filter-status-all"
        />
        {INVOICE_STATUSES.map(s => (
          <Chip
            key={s}
            label={s}
            selected={status === s}
            onPress={() => onStatusChange(s)}
            testID={`filter-status-${s}`}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {INVOICE_SORT_FIELDS.map(field => (
          <Chip
            key={field}
            label={`${SORT_LABELS[field]} ${sortBy === field ? (sortDirection === 'asc' ? '↑' : '↓') : ''}`}
            selected={sortBy === field}
            onPress={() => onSortChange(field)}
            testID={`sort-${field}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const text = (
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label.trim()}</Text>
  );
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={styles.chipTouchable}
    >
      {selected ? (
        <GradientSurface style={styles.chip}>{text}</GradientSurface>
      ) : (
        <View style={[styles.chip, styles.chipIdle]}>{text}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 14, paddingBottom: 4 },
  chipRow: { marginBottom: 8 },
  chipRowContent: { paddingHorizontal: 12 },
  chipTouchable: { marginHorizontal: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  chipIdle: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  chipText: { fontSize: 13, color: colors.ink, fontWeight: '700' },
  chipTextSelected: { color: colors.onPrimary },
});
