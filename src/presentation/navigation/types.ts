export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  InvoiceList: undefined;
  CreateInvoice: undefined;
  Profile: undefined;
};

export type RootStackParamList = AuthStackParamList & MainStackParamList;
