import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TextField } from '../../components/common/TextField';
import { Button } from '../../components/common/Button';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { useCreateInvoice } from '../../hooks/useCreateInvoice';
import { createInvoiceSchema, type CreateInvoiceFormValues } from './schema';
import type { MainStackParamList } from '../../navigation/types';
import { colors } from '../../../core/theme/colors';

type Props = NativeStackScreenProps<MainStackParamList, 'CreateInvoice'>;

// A function, not a module-level constant: a constant would freeze "today"
// at JS-bundle load time, showing a stale date if the app stays open (or
// the bundle is cached) across midnight.
function makeDefaultValues(): CreateInvoiceFormValues {
  const today = new Date().toISOString().slice(0, 10);
  return {
    customerName: '',
    currency: 'USD',
    issueDate: today,
    dueDate: today,
    description: '',
    quantity: '1',
    unitPrice: '',
  };
}

/**
 * Single line item, per the requirement — the form has exactly one set of
 * description/quantity/unit-price fields, not a repeatable field array.
 */
export function CreateInvoiceScreen({ navigation }: Props) {
  const { submit, isSubmitting, error } = useCreateInvoice();
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: makeDefaultValues(),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Could not create invoice', error);
    }
  }, [error]);

  const onSubmit = async (values: CreateInvoiceFormValues) => {
    try {
      await submit({
        customerName: values.customerName,
        currency: values.currency,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        lineItem: {
          description: values.description,
          quantity: Number(values.quantity),
          unitPrice: Number(values.unitPrice),
        },
      });
      setShowSuccess(true);
    } catch {
      // `error` from useCreateInvoice already drives the Alert above via
      // the effect; nothing further to do here.
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="New Invoice" onBack={() => navigation.goBack()} />

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} testID="create-success-modal">
            <Text style={styles.modalTitle}>Invoice created</Text>
            <Text style={styles.modalMessage}>Your invoice was created successfully.</Text>
            <Button
              label="OK"
              testID="create-success-ok"
              onPress={() => {
                setShowSuccess(false);
                navigation.goBack();
              }}
            />
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Field name="customerName" label="Customer name" control={control} errors={errors} />
      <Field name="currency" label="Currency" control={control} errors={errors} autoCapitalize="characters" />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field name="issueDate" label="Issue date (YYYY-MM-DD)" control={control} errors={errors} />
        </View>
        <View style={styles.half}>
          <Field name="dueDate" label="Due date (YYYY-MM-DD)" control={control} errors={errors} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Line item</Text>
      <Field name="description" label="Description" control={control} errors={errors} />
      <View style={styles.row}>
        <View style={styles.half}>
          <Field name="quantity" label="Quantity" control={control} errors={errors} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Field name="unitPrice" label="Unit price" control={control} errors={errors} keyboardType="decimal-pad" />
        </View>
      </View>

      <Button
        label="Create invoice"
        testID="create-invoice-submit"
        isLoading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
      </ScrollView>
    </View>
  );
}

/**
 * Thin adapter between React Hook Form's `<Controller>` and the shared
 * `<TextField>` — keeps every field in this form to one line instead of
 * repeating the Controller/render-prop boilerplate seven times.
 */
function Field({
  name,
  label,
  control,
  errors,
  ...rest
}: {
  name: keyof CreateInvoiceFormValues;
  label: string;
  control: ReturnType<typeof useForm<CreateInvoiceFormValues>>['control'];
  errors: ReturnType<typeof useForm<CreateInvoiceFormValues>>['formState']['errors'];
  [key: string]: unknown;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField
          label={label}
          testID={`create-invoice-${name}`}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          errorMessage={errors[name]?.message as string | undefined}
          {...rest}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, flexGrow: 1 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.accentText,
    marginBottom: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40,33,26,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  modalMessage: { fontSize: 14, color: colors.muted, marginBottom: 10 },
});
