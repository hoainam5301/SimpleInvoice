import { AuthRepositoryImpl } from '../../data/repositories/AuthRepositoryImpl';
import { InvoiceRepositoryImpl } from '../../data/repositories/InvoiceRepositoryImpl';
import { LoginUseCase } from '../../domain/usecases/auth/LoginUseCase';
import { LogoutUseCase } from '../../domain/usecases/auth/LogoutUseCase';
import { RestoreSessionUseCase } from '../../domain/usecases/auth/RestoreSessionUseCase';
import { GetInvoicesUseCase } from '../../domain/usecases/invoice/GetInvoicesUseCase';
import { CreateInvoiceUseCase } from '../../domain/usecases/invoice/CreateInvoiceUseCase';

/**
 * Minimal manual composition root — deliberately not a DI framework
 * (InversifyJS/tsyringe). At this app's size, a plain object of singletons
 * is easier to read and step through than decorator-based magic; hooks pull
 * use cases from here instead of `new`-ing repositories themselves, which
 * is what keeps the Presentation layer ignorant of `AuthRepositoryImpl` /
 * axios / Keychain. Revisit if the dependency graph grows past ~15-20 nodes
 * or per-request/per-scope lifetimes are needed (see DECISIONS.md).
 */
const authRepository = new AuthRepositoryImpl();
const invoiceRepository = new InvoiceRepositoryImpl();

export const container = {
  useCases: {
    login: new LoginUseCase(authRepository),
    logout: new LogoutUseCase(authRepository),
    restoreSession: new RestoreSessionUseCase(authRepository),
    getInvoices: new GetInvoicesUseCase(invoiceRepository),
    createInvoice: new CreateInvoiceUseCase(invoiceRepository),
  },
};
