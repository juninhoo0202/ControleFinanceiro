import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { STORAGE_KEY, useFinanceStore } from "./financeStore";

function createLocalStorageMock(seed = {}) {
  const data = { ...seed };

  return {
    getItem: vi.fn(key => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null)),
    setItem: vi.fn((key, value) => {
      data[key] = String(value);
    }),
    removeItem: vi.fn(key => {
      delete data[key];
    }),
    clear: vi.fn(() => {
      Object.keys(data).forEach(key => delete data[key]);
    }),
    key: vi.fn(index => Object.keys(data)[index] || null),
    get length() {
      return Object.keys(data).length;
    }
  };
}

function createStore(seed) {
  let nextId = 0;

  vi.stubGlobal("localStorage", createLocalStorageMock(
    seed ? { [STORAGE_KEY]: JSON.stringify(seed) } : {}
  ));
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => `test-id-${nextId += 1}`)
  });

  setActivePinia(createPinia());
  return useFinanceStore();
}

describe("financeStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 10, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("usa a data local para o mes ativo e inputs de data", () => {
    const store = createStore();

    expect(store.activeMonth).toBe("2026-06");
    expect(store.toInputDate(new Date(2026, 5, 1, 23, 59))).toBe("2026-06-01");
  });

  it("mantem preferencia de tema claro ou escuro", () => {
    const store = createStore({
      settings: { activeMonth: "2026-06", theme: "dark" }
    });

    expect(store.theme).toBe("dark");
    expect(store.isDarkMode).toBe(true);

    store.toggleTheme();
    expect(store.theme).toBe("light");
    expect(store.isDarkMode).toBe(false);

    store.setTheme("dark");
    expect(store.theme).toBe("dark");
  });

  it("calcula saldo, entradas e saidas do mes separado dos totais gerais", () => {
    const store = createStore();

    store.saveProfile({ name: "Ana", initialBalance: 1000, privacy: false });
    store.upsertTransaction({
      tipo: "entrada",
      categoria: "Salario",
      descricao: "Pagamento",
      valor: 3000,
      data: "2026-06-05"
    });
    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Mercado",
      descricao: "Compra do mes",
      valor: 450,
      data: "2026-06-06"
    });
    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Mercado",
      descricao: "Compra antiga",
      valor: 50,
      data: "2026-05-31"
    });

    expect(store.monthEntriesTotal).toBe(3000);
    expect(store.monthExpensesTotal).toBe(450);
    expect(store.monthResult).toBe(2550);
    expect(store.entriesTotal).toBe(3000);
    expect(store.expensesTotal).toBe(500);
    expect(store.currentBalance).toBe(3500);
  });

  it("destaca categorias acima do limite e gastos sem orcamento", () => {
    const store = createStore();

    store.saveBudget({ mes: "2026-06", categoria: "Mercado", limite: 300 });
    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Mercado",
      descricao: "Supermercado",
      valor: 450,
      data: "2026-06-10"
    });
    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Transporte",
      descricao: "Uber",
      valor: 40,
      data: "2026-06-11"
    });

    expect(store.budgetTotal).toBe(300);
    expect(store.budgetUsage).toBe(150);
    expect(store.overBudgetCategories.map(category => category.name)).toContain("Mercado");
    expect(store.unplannedCategories.map(category => category.name)).toContain("Transporte");
  });

  it("mantem transacoes de data digitada no dia correto do fluxo diario", () => {
    const store = createStore();

    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Mercado",
      descricao: "Compra no primeiro dia",
      valor: 25,
      data: "2026-06-01"
    });

    expect(store.toInputDate(store.monthTransactions[0].data)).toBe("2026-06-01");
    expect(store.cashFlowSeries[0]).toMatchObject({
      day: 1,
      label: "01",
      gastos: 25,
      resultado: -25
    });
  });

  it("importa backup normalizando valores e substituindo o estado atual", () => {
    const store = createStore();

    store.upsertTransaction({
      tipo: "gasto",
      categoria: "Mercado",
      descricao: "Registro antigo",
      valor: 99,
      data: "2026-06-01"
    });

    const response = store.importData({
      data: {
        profile: { name: "Bruno", initialBalance: "500", privacy: true },
        settings: { activeMonth: "2026-07" },
        budgets: [{ mes: "2026-07", categoria: "Lazer", limite: "200" }],
        transactions: [{
          tipo: "gasto",
          categoria: "Lazer",
          descricao: "Cinema",
          valor: "80",
          data: "2026-07-03"
        }]
      }
    });

    expect(response.ok).toBe(true);
    expect(store.profileName).toBe("Bruno");
    expect(store.state.profile.privacy).toBe(true);
    expect(store.activeMonth).toBe("2026-07");
    expect(store.state.transactions).toHaveLength(1);
    expect(store.monthExpensesTotal).toBe(80);
    expect(store.budgetRemaining).toBe(120);
  });

  it("cria, bloqueia e desbloqueia acesso local por PIN", () => {
    const store = createStore();

    expect(store.isAuthenticated).toBe(false);
    expect(store.hasAccessPin).toBe(false);

    expect(store.setupAccess({ name: "Carla", pin: "12" }).ok).toBe(false);

    const created = store.setupAccess({ name: "Carla", pin: "1234", recoveryEmail: "carla@email.com" });
    expect(created.ok).toBe(true);
    expect(store.profileName).toBe("Carla");
    expect(store.hasAccessPin).toBe(true);
    expect(store.hasRecoveryEmail).toBe(true);
    expect(store.isAuthenticated).toBe(true);

    store.lockAccess();
    expect(store.isAuthenticated).toBe(false);
    expect(store.unlockAccess("0000").ok).toBe(false);
    expect(store.unlockAccess("1234").ok).toBe(true);

    expect(store.exportData().data.profile.authenticated).toBe(false);
  });

  it("redefine o PIN usando e-mail e codigo de recuperacao", () => {
    const store = createStore();

    store.setupAccess({ name: "Dani", pin: "1234", recoveryEmail: "dani@email.com" });
    store.lockAccess();

    expect(store.requestPinReset("outro@email.com").ok).toBe(false);

    const recovery = store.requestPinReset("dani@email.com");
    expect(recovery.ok).toBe(true);
    expect(recovery.code).toMatch(/^\d{6}$/);

    expect(store.resetAccessWithCode({
      email: "dani@email.com",
      code: "000000",
      pin: "9876"
    }).ok).toBe(false);

    const response = store.resetAccessWithCode({
      email: "dani@email.com",
      code: recovery.code,
      pin: "9876"
    });

    expect(response.ok).toBe(true);
    expect(store.isAuthenticated).toBe(true);

    store.lockAccess();
    expect(store.unlockAccess("1234").ok).toBe(false);
    expect(store.unlockAccess("9876").ok).toBe(true);
  });
});
