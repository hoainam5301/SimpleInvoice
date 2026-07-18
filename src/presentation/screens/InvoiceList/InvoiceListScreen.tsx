import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useInvoices } from '../../hooks/useInvoices';
import { useInvoiceFilters } from '../../hooks/useInvoiceFilters';
import { useAuth } from '../../hooks/useAuth';
import { InvoiceListItem, INVOICE_ITEM_HEIGHT } from './components/InvoiceListItem';
import { InvoiceFilterBar } from './components/InvoiceFilterBar';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { ErrorView } from '../../components/common/ErrorView';
import { Button } from '../../components/common/Button';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import type { MainStackParamList } from '../../navigation/types';
import type { Invoice } from '../../../domain/entities/Invoice';
import { colors } from '../../../core/theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'InvoiceList'>;

function getInitials(fullName: string | undefined): string {
  return (fullName ?? '?')
    .split(/\s+/)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function InvoiceListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    search,
    setSearch,
    status,
    setStatus,
    sortBy,
    sortDirection,
    setSort,
    filters,
  } = useInvoiceFilters();

  const { invoices, isInitialLoading, isFetchingMore, error, loadMore, refresh } = useInvoices({
    filters,
  });

  const renderItem = useCallback(({ item }: { item: Invoice }) => <InvoiceListItem invoice={item} />, []);
  const keyExtractor = useCallback((item: Invoice) => item.id, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Invoices"
        right={
          <Pressable
            testID="open-profile"
            accessibilityRole="button"
            accessibilityLabel="Account menu"
            onPress={() => setMenuOpen(open => !open)}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
          </Pressable>
        }
      >
        <TextInput
          testID="invoice-search-input"
          style={styles.searchInput}
          placeholder="Search invoices or customers"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          accessibilityLabel="Search invoices"
        />
      </ScreenHeader>

      {menuOpen ? (
        <>
          {/* Invisible backdrop: a tap anywhere outside the menu closes it. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} testID="menu-backdrop" />
          <View style={styles.menu}>
            <Pressable
              testID="menu-profile"
              accessibilityRole="button"
              style={styles.menuRow}
              onPress={() => {
                closeMenu();
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.menuText}>Profile</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              testID="menu-logout"
              accessibilityRole="button"
              style={styles.menuRow}
              onPress={() => {
                closeMenu();
                logout();
              }}
            >
              <Text style={[styles.menuText, styles.menuLogout]}>Log out</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <InvoiceFilterBar
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={setSort}
      />

      <View style={styles.createButtonWrapper}>
        <Button
          label="+ New Invoice"
          testID="create-invoice-cta"
          onPress={() => navigation.navigate('CreateInvoice')}
        />
      </View>

      {isInitialLoading ? (
        <LoadingIndicator testID="invoice-list-loading" />
      ) : error ? (
        <ErrorView message={error} onRetry={refresh} testID="invoice-list-error" />
      ) : (
        <FlatList
          testID="invoice-list"
          data={invoices}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshing={false}
          onRefresh={refresh}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No invoices match.</Text>
            </View>
          }
          ListFooterComponent={isFetchingMore ? <LoadingIndicator testID="invoice-list-footer-loading" /> : null}
          // Rows are fixed-height (see InvoiceListItem styles); getItemLayout
          // avoids FlatList's default onLayout measurement pass for very
          // long lists, which matters once invoices run into the hundreds.
          getItemLayout={(_, index) => ({
            length: INVOICE_ITEM_HEIGHT,
            offset: INVOICE_ITEM_HEIGHT * index,
            index,
          })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onPrimary, fontSize: 13, fontWeight: '800' },
  searchInput: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.ink,
  },
  menu: {
    position: 'absolute',
    top: 108,
    right: 16,
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 10,
    overflow: 'hidden',
  },
  menuRow: { paddingVertical: 13, paddingHorizontal: 16 },
  menuText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  menuLogout: { color: colors.danger },
  menuDivider: { height: 1, backgroundColor: colors.divider },
  createButtonWrapper: { paddingHorizontal: 16, paddingBottom: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: colors.placeholder, fontSize: 14, textAlign: 'center' },
});
