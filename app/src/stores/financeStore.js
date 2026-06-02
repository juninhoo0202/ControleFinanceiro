import { computed, reactive, watch } from "vue";
import { defineStore } from "pinia";

export const STORAGE_KEY = "financepro:v2";

export const defaultCategories = [
  { id: "mercado", name: "Mercado", icon: "ShoppingBasket", tone: "green", custom: false },
  { id: "transporte", name: "Transporte", icon: "BusFront", tone: "sky", custom: false },
  { id: "moradia", name: "Moradia", icon: "HousePlug", tone: "indigo", custom: false },
  { id: "contas", name: "Contas", icon: "ReceiptText", tone: "amber", custom: false },
  { id: "restaurante", name: "Restaurante", icon: "UtensilsCrossed", tone: "orange", custom: false },
  { id: "saude", name: "Saude", icon: "HeartPulse", tone: "rose", custom: false },
  { id: "lazer", name: "Lazer", icon: "Clapperboard", tone: "violet", custom: false },
  { id: "estudos", name: "Estudos", icon: "BookOpen", tone: "cyan", custom: false },
  { id: "tecnologia", name: "Tecnologia", icon: "Laptop", tone: "blue", custom: false }
];

const defaultCategoryById = new Map(defaultCategories.map(category => [category.id, category]));

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate())
  ].join("-");
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}`;
}

function parseLocalDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === "string") {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnly) {
      const [, year, month, day] = dateOnly;
      return new Date(Number(year), Number(month) - 1, Number(day), 12);
    }
  }

  return value ? new Date(value) : new Date();
}

function safeLocalDate(value) {
  const date = parseLocalDate(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function currentMonthKey() {
  return formatMonthKey(new Date());
}

function createDefaultState() {
  return {
    profile: {
      name: "",
      initialBalance: 0,
      privacy: false,
      pinHash: "",
      authenticated: false,
      recoveryEmail: "",
      resetCodeHash: "",
      resetCodeExpiresAt: ""
    },
    settings: {
      activeMonth: currentMonthKey()
    },
    categories: defaultCategories.map(category => ({ ...category })),
    budgets: [],
    transactions: []
  };
}

function toMoneyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizePin(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function hashPin(value) {
  const pin = normalizePin(value);
  let hash = 2166136261;

  for (const character of `financepro:${pin}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `local-${(hash >>> 0).toString(16)}`;
}

function hashRecoveryCode(value) {
  const code = normalizePin(value);
  let hash = 2166136261;

  for (const character of `financepro-reset:${code}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return `reset-${(hash >>> 0).toString(16)}`;
}

function createRecoveryCode() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(values[0] % 1000000).padStart(6, "0");
  }

  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

function createId(prefix = "item") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function monthKeyFromDate(value) {
  const date = value ? parseLocalDate(value) : new Date();
  if (Number.isNaN(date.getTime())) return currentMonthKey();
  return formatMonthKey(date);
}

function toInputDate(value) {
  return formatDateKey(safeLocalDate(value));
}

function toStoredDate(value) {
  return safeLocalDate(value).toISOString();
}

function normalizeTransaction(transaction) {
  const tipo = transaction?.tipo === "entrada" ? "entrada" : "gasto";

  return {
    id: transaction?.id || createId("transaction"),
    tipo,
    categoria: String(transaction?.categoria || "").trim() || "Sem categoria",
    descricao: String(transaction?.descricao || "").trim() || "Sem descricao",
    valor: Math.max(toMoneyNumber(transaction?.valor), 0),
    data: toStoredDate(transaction?.data)
  };
}

function normalizeBudget(budget) {
  return {
    id: budget?.id || createId("budget"),
    mes: /^\d{4}-\d{2}$/.test(String(budget?.mes || "")) ? budget.mes : currentMonthKey(),
    categoria: String(budget?.categoria || "").trim(),
    limite: Math.max(toMoneyNumber(budget?.limite), 0)
  };
}

function normalizeCategory(category) {
  const fallback = defaultCategoryById.get(category?.id);
  const custom = Boolean(category?.custom);
  const name = String(category?.name || fallback?.name || "Categoria").trim();

  return {
    id: category?.id || createId("category"),
    name,
    icon: custom
      ? category?.icon || suggestIcon(name)
      : fallback?.icon || category?.icon || suggestIcon(name),
    tone: custom
      ? category?.tone || suggestTone(name)
      : fallback?.tone || category?.tone || suggestTone(name),
    custom
  };
}

function normalizeLoadedState(saved) {
  const fallback = createDefaultState();
  const savedCategories = Array.isArray(saved?.categories) && saved.categories.length
    ? saved.categories
    : fallback.categories;

  return {
    profile: {
      name: saved?.profile?.name || "",
      initialBalance: toMoneyNumber(saved?.profile?.initialBalance),
      privacy: Boolean(saved?.profile?.privacy),
      pinHash: String(saved?.profile?.pinHash || ""),
      authenticated: false,
      recoveryEmail: normalizeEmail(saved?.profile?.recoveryEmail),
      resetCodeHash: "",
      resetCodeExpiresAt: ""
    },
    settings: {
      activeMonth: /^\d{4}-\d{2}$/.test(String(saved?.settings?.activeMonth || ""))
        ? saved.settings.activeMonth
        : currentMonthKey()
    },
    categories: savedCategories.map(category => normalizeCategory(category)),
    budgets: Array.isArray(saved?.budgets)
      ? saved.budgets.map(normalizeBudget).filter(budget => budget.categoria)
      : [],
    transactions: Array.isArray(saved?.transactions)
      ? saved.transactions.map(normalizeTransaction).filter(transaction => transaction.valor > 0)
      : []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    const saved = JSON.parse(raw);
    return normalizeLoadedState(saved);
  } catch {
    return createDefaultState();
  }
}

function suggestIcon(name) {
  const text = normalizeText(name);

  if (text.includes("salario") || text.includes("renda") || text.includes("receita") || text.includes("freela")) return "HandCoins";
  if (text.includes("invest") || text.includes("aplicacao") || text.includes("poupanca")) return "ChartNoAxesCombined";
  if (text.includes("banco") || text.includes("financiamento") || text.includes("emprestimo")) return "Landmark";
  if (text.includes("cartao") || text.includes("credito") || text.includes("debito")) return "CreditCard";
  if (text.includes("mercado") || text.includes("compra") || text.includes("super") || text.includes("feira")) return "ShoppingBasket";
  if (text.includes("shopping") || text.includes("presente")) return "ShoppingBag";
  if (text.includes("gasolina") || text.includes("combust") || text.includes("posto")) return "Fuel";
  if (text.includes("uber") || text.includes("taxi") || text.includes("carro") || text.includes("auto")) return "Car";
  if (text.includes("onibus") || text.includes("metro") || text.includes("transporte")) return "BusFront";
  if (text.includes("viagem") || text.includes("passagem") || text.includes("hotel")) return "Plane";
  if (text.includes("rest") || text.includes("lanche") || text.includes("pizza") || text.includes("comida") || text.includes("delivery")) return "UtensilsCrossed";
  if (text.includes("farm") || text.includes("remedio")) return "Pill";
  if (text.includes("medico") || text.includes("consulta") || text.includes("saude") || text.includes("hospital")) return "Stethoscope";
  if (text.includes("luz") || text.includes("energia") || text.includes("agua") || text.includes("internet") || text.includes("conta")) return "ReceiptText";
  if (text.includes("wifi")) return "Wifi";
  if (text.includes("curso") || text.includes("faculdade") || text.includes("escola") || text.includes("estudo")) return "BookOpen";
  if (text.includes("tec") || text.includes("pc") || text.includes("notebook") || text.includes("software")) return "Laptop";
  if (text.includes("celular") || text.includes("telefone")) return "Smartphone";
  if (text.includes("lazer") || text.includes("cinema") || text.includes("show")) return "Clapperboard";
  if (text.includes("jogo") || text.includes("game")) return "Gamepad2";
  if (text.includes("academia") || text.includes("treino") || text.includes("esporte")) return "Dumbbell";
  if (text.includes("casa") || text.includes("aluguel") || text.includes("moradia") || text.includes("condominio")) return "HousePlug";
  if (text.includes("roupa") || text.includes("moda")) return "Shirt";
  if (text.includes("trabalho") || text.includes("empresa")) return "BriefcaseBusiness";
  if (text.includes("seguro") || text.includes("protecao")) return "ShieldCheck";
  if (text.includes("presente") || text.includes("aniversario")) return "Gift";

  return "Tag";
}

function suggestTone(name) {
  const text = normalizeText(name);

  if (text.includes("salario") || text.includes("renda") || text.includes("receita") || text.includes("freela")) return "green";
  if (text.includes("invest") || text.includes("poupanca") || text.includes("banco")) return "teal";
  if (text.includes("cartao") || text.includes("credito") || text.includes("debito")) return "blue";
  if (text.includes("mercado") || text.includes("compra") || text.includes("super") || text.includes("feira")) return "green";
  if (text.includes("transporte") || text.includes("uber") || text.includes("taxi") || text.includes("carro") || text.includes("onibus") || text.includes("metro") || text.includes("gasolina") || text.includes("combust")) return "sky";
  if (text.includes("viagem") || text.includes("passagem") || text.includes("hotel")) return "cyan";
  if (text.includes("rest") || text.includes("lanche") || text.includes("pizza") || text.includes("comida") || text.includes("delivery")) return "orange";
  if (text.includes("farm") || text.includes("remedio") || text.includes("medico") || text.includes("consulta") || text.includes("saude") || text.includes("hospital")) return "rose";
  if (text.includes("luz") || text.includes("energia") || text.includes("agua") || text.includes("internet") || text.includes("conta") || text.includes("wifi")) return "amber";
  if (text.includes("curso") || text.includes("faculdade") || text.includes("escola") || text.includes("estudo")) return "cyan";
  if (text.includes("tec") || text.includes("pc") || text.includes("notebook") || text.includes("software") || text.includes("celular")) return "blue";
  if (text.includes("lazer") || text.includes("cinema") || text.includes("show") || text.includes("jogo") || text.includes("game")) return "violet";
  if (text.includes("academia") || text.includes("treino") || text.includes("esporte")) return "lime";
  if (text.includes("casa") || text.includes("aluguel") || text.includes("moradia") || text.includes("condominio")) return "indigo";
  if (text.includes("roupa") || text.includes("moda")) return "pink";
  if (text.includes("trabalho") || text.includes("empresa")) return "slate";
  if (text.includes("seguro") || text.includes("protecao")) return "teal";
  if (text.includes("presente") || text.includes("aniversario")) return "violet";

  return "teal";
}

function sameMonth(transaction, month) {
  return monthKeyFromDate(transaction.data) === month;
}

function compareByDateDesc(a, b) {
  return new Date(b.data) - new Date(a.data);
}

export const useFinanceStore = defineStore("finance", () => {
  const state = reactive(loadState());

  watch(
    state,
    value => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
    { deep: true }
  );

  const profileName = computed(() => state.profile.name || "Usuario");
  const hasAccessPin = computed(() => Boolean(state.profile.pinHash));
  const isAuthenticated = computed(() => Boolean(state.profile.authenticated));
  const hasRecoveryEmail = computed(() => Boolean(state.profile.recoveryEmail));
  const activeMonth = computed(() => state.settings.activeMonth);
  const activeMonthLabel = computed(() => {
    const [year, month] = activeMonth.value.split("-");
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric"
    }).format(new Date(Number(year), Number(month) - 1, 1));
  });

  const transactionsNewest = computed(() => [...state.transactions].sort(compareByDateDesc));
  const monthTransactions = computed(() => {
    return transactionsNewest.value.filter(transaction => sameMonth(transaction, activeMonth.value));
  });
  const monthExpenses = computed(() => {
    return monthTransactions.value.filter(transaction => transaction.tipo === "gasto");
  });
  const monthEntries = computed(() => {
    return monthTransactions.value.filter(transaction => transaction.tipo === "entrada");
  });
  const entriesTotal = computed(() => {
    return state.transactions
      .filter(transaction => transaction.tipo === "entrada")
      .reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);
  });
  const expensesTotal = computed(() => {
    return state.transactions
      .filter(transaction => transaction.tipo === "gasto")
      .reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);
  });
  const monthEntriesTotal = computed(() => {
    return monthEntries.value.reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);
  });
  const monthExpensesTotal = computed(() => {
    return monthExpenses.value.reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);
  });
  const currentBalance = computed(() => state.profile.initialBalance + entriesTotal.value - expensesTotal.value);
  const result = computed(() => entriesTotal.value - expensesTotal.value);
  const monthResult = computed(() => monthEntriesTotal.value - monthExpensesTotal.value);
  const biggestExpense = computed(() => {
    return state.transactions
      .filter(transaction => transaction.tipo === "gasto")
      .reduce((biggest, transaction) => Math.max(biggest, transaction.valor), 0);
  });
  const monthBiggestExpense = computed(() => {
    return monthExpenses.value.reduce((biggest, transaction) => Math.max(biggest, transaction.valor), 0);
  });
  const lastTransaction = computed(() => transactionsNewest.value[0] || null);
  const monthBudgets = computed(() => {
    return state.budgets.filter(budget => budget.mes === activeMonth.value);
  });
  const budgetTotal = computed(() => {
    return monthBudgets.value.reduce((total, budget) => total + toMoneyNumber(budget.limite), 0);
  });
  const expenseRate = computed(() => {
    return monthEntriesTotal.value > 0 ? (monthExpensesTotal.value / monthEntriesTotal.value) * 100 : 0;
  });

  const monthlyCategorySummary = computed(() => {
    const summary = {};

    state.categories.forEach(category => {
      summary[category.name] = {
        name: category.name,
        icon: category.icon,
        tone: category.tone,
        limit: 0,
        spent: 0,
        count: 0
      };
    });

    monthBudgets.value.forEach(budget => {
      if (!summary[budget.categoria]) {
        summary[budget.categoria] = {
          name: budget.categoria,
          icon: suggestIcon(budget.categoria),
          tone: suggestTone(budget.categoria),
          limit: 0,
          spent: 0,
          count: 0
        };
      }

      summary[budget.categoria].limit += toMoneyNumber(budget.limite);
    });

    monthExpenses.value.forEach(transaction => {
      const category = transaction.categoria || "Sem categoria";

      if (!summary[category]) {
        summary[category] = {
          name: category,
          icon: suggestIcon(category),
          tone: suggestTone(category),
          limit: 0,
          spent: 0,
          count: 0
        };
      }

      summary[category].spent += toMoneyNumber(transaction.valor);
      summary[category].count += 1;
    });

    return Object.values(summary)
      .map(item => {
        const remaining = item.limit - item.spent;
        return {
          ...item,
          remaining,
          average: item.count > 0 ? item.spent / item.count : 0,
          percentOfBudget: item.limit > 0 ? (item.spent / item.limit) * 100 : 0,
          percentOfSpending: monthExpensesTotal.value > 0 ? (item.spent / monthExpensesTotal.value) * 100 : 0,
          overBudget: item.limit > 0 && item.spent > item.limit,
          unplanned: item.limit <= 0 && item.spent > 0
        };
      })
      .sort((a, b) => {
        if (a.overBudget !== b.overBudget) return a.overBudget ? -1 : 1;
        if (a.spent !== b.spent) return b.spent - a.spent;
        return a.name.localeCompare(b.name);
      });
  });

  const groupedExpenses = computed(() => {
    return monthlyCategorySummary.value
      .filter(category => category.spent > 0)
      .map(category => ({
        name: category.name,
        total: category.spent,
        count: category.count,
        average: category.average,
        percent: category.percentOfSpending
      }));
  });

  const biggestCategory = computed(() => groupedExpenses.value[0] || null);
  const budgetedSpending = computed(() => {
    return monthlyCategorySummary.value
      .filter(category => category.limit > 0)
      .reduce((total, category) => total + category.spent, 0);
  });
  const budgetRemaining = computed(() => budgetTotal.value - budgetedSpending.value);
  const budgetUsage = computed(() => {
    return budgetTotal.value > 0 ? (budgetedSpending.value / budgetTotal.value) * 100 : 0;
  });
  const overBudgetCategories = computed(() => {
    return monthlyCategorySummary.value.filter(category => category.overBudget);
  });
  const unplannedCategories = computed(() => {
    return monthlyCategorySummary.value.filter(category => category.unplanned);
  });
  const hasFinancialData = computed(() => {
    return state.profile.initialBalance > 0 || state.transactions.length > 0 || state.budgets.length > 0;
  });
  const cashFlowSeries = computed(() => {
    const [year, month] = activeMonth.value.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const dayTransactions = monthTransactions.value.filter(transaction => {
        return parseLocalDate(transaction.data).getDate() === day;
      });
      const entradas = dayTransactions
        .filter(transaction => transaction.tipo === "entrada")
        .reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);
      const gastos = dayTransactions
        .filter(transaction => transaction.tipo === "gasto")
        .reduce((total, transaction) => total + toMoneyNumber(transaction.valor), 0);

      return {
        day,
        label: String(day).padStart(2, "0"),
        entradas,
        gastos,
        resultado: entradas - gastos
      };
    });
  });
  const health = computed(() => {
    if (!hasFinancialData.value) {
      return {
        score: 0,
        status: "Configure sua conta",
        tone: "muted",
        copy: "Cadastre saldo inicial, entradas, despesas e limites para liberar a leitura do mes."
      };
    }

    let score = 72;

    if (monthEntriesTotal.value > 0) {
      score += Math.max(0, 22 - Math.round(expenseRate.value * 0.3));
    }

    if (budgetTotal.value > 0) {
      score += Math.max(-28, 18 - Math.round(budgetUsage.value * 0.24));
    } else {
      score -= 10;
    }

    if (currentBalance.value < 0) score -= 25;
    if (monthResult.value < 0) score -= 12;
    score -= overBudgetCategories.value.length * 8;
    score -= unplannedCategories.value.length * 4;

    score = Math.min(Math.max(score, 0), 100);

    if (score >= 75) {
      return {
        score,
        status: "Mes sob controle",
        tone: "good",
        copy: "Seu fluxo do mes e o uso do orcamento estao dentro de uma faixa saudavel."
      };
    }

    if (score >= 50) {
      return {
        score,
        status: "Acompanhar limites",
        tone: "warning",
        copy: "Algumas categorias ou o saldo do mes pedem revisao antes dos proximos lancamentos."
      };
    }

    return {
      score,
      status: "Risco de deficit",
      tone: "danger",
      copy: "O mes esta pressionado. Priorize categorias acima do limite e gastos sem orcamento."
    };
  });

  function money(value) {
    return Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function date(value) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short"
    }).format(new Date(value));
  }

  function categoryByName(name) {
    const normalized = normalizeText(name);
    return state.categories.find(category => normalizeText(category.name) === normalized);
  }

  function setActiveMonth(month) {
    if (!/^\d{4}-\d{2}$/.test(String(month || ""))) return;
    state.settings.activeMonth = month;
  }

  function addCategory(name) {
    const cleaned = String(name || "").trim();
    if (!cleaned) {
      return { ok: false, message: "Digite o nome da categoria." };
    }

    const exists = state.categories.some(category => normalizeText(category.name) === normalizeText(cleaned));
    if (exists) {
      return { ok: false, message: "Essa categoria ja existe." };
    }

    const category = {
      id: createId("category"),
      name: cleaned,
      icon: suggestIcon(cleaned),
      tone: suggestTone(cleaned),
      custom: true
    };

    state.categories.push(category);
    return { ok: true, category, message: "Categoria criada." };
  }

  function saveBudget(payload) {
    const categoria = String(payload.categoria || "").trim();
    const limite = Math.max(toMoneyNumber(payload.limite), 0);
    const mes = /^\d{4}-\d{2}$/.test(String(payload.mes || ""))
      ? payload.mes
      : activeMonth.value;

    if (!categoria) {
      return { ok: false, message: "Escolha uma categoria." };
    }

    if (limite <= 0) {
      return { ok: false, message: "Informe um limite maior que zero." };
    }

    const existing = state.budgets.find(budget => {
      return budget.mes === mes && normalizeText(budget.categoria) === normalizeText(categoria);
    });

    if (existing) {
      existing.limite = limite;
      existing.categoria = categoria;
      return { ok: true, budget: existing, message: "Orcamento atualizado." };
    }

    const budget = {
      id: createId("budget"),
      mes,
      categoria,
      limite
    };

    state.budgets.push(budget);
    return { ok: true, budget, message: "Orcamento criado." };
  }

  function deleteBudget(id) {
    const index = state.budgets.findIndex(budget => budget.id === id);
    if (index >= 0) {
      state.budgets.splice(index, 1);
    }
  }

  function upsertTransaction(payload) {
    const categoria = String(payload.categoria || "").trim();
    const descricao = String(payload.descricao || "").trim();
    const valor = toMoneyNumber(payload.valor);
    const tipo = payload.tipo === "entrada" ? "entrada" : "gasto";
    const data = payload.data ? parseLocalDate(payload.data) : new Date();

    if (!categoria || !descricao || valor <= 0 || Number.isNaN(data.getTime())) {
      return { ok: false, message: "Preencha categoria, descricao, valor e data." };
    }

    const transaction = {
      id: payload.id || createId("transaction"),
      tipo,
      categoria,
      descricao,
      valor,
      data: toStoredDate(data)
    };

    const index = state.transactions.findIndex(item => item.id === transaction.id);
    if (index >= 0) {
      state.transactions.splice(index, 1, transaction);
      return { ok: true, transaction, message: "Transacao atualizada." };
    }

    state.transactions.push(transaction);
    return { ok: true, transaction, message: tipo === "entrada" ? "Entrada registrada." : "Gasto registrado." };
  }

  function addTransaction(payload) {
    return upsertTransaction({
      ...payload,
      data: payload.data || toInputDate(new Date())
    });
  }

  function deleteTransaction(id) {
    const index = state.transactions.findIndex(transaction => transaction.id === id);
    if (index >= 0) {
      state.transactions.splice(index, 1);
    }
  }

  function saveProfile(profile) {
    state.profile.name = String(profile.name || "").trim();
    state.profile.initialBalance = Math.max(toMoneyNumber(profile.initialBalance), 0);
    state.profile.privacy = Boolean(profile.privacy);
  }

  function setupAccess(payload) {
    const name = String(payload?.name || "").trim();
    const pin = normalizePin(payload?.pin);
    const recoveryEmail = normalizeEmail(payload?.recoveryEmail);

    if (!name) {
      return { ok: false, message: "Informe seu nome." };
    }

    if (pin.length < 4) {
      return { ok: false, message: "Crie um PIN com pelo menos 4 numeros." };
    }

    if (!isValidEmail(recoveryEmail)) {
      return { ok: false, message: "Informe um e-mail de recuperacao valido." };
    }

    state.profile.name = name;
    state.profile.pinHash = hashPin(pin);
    state.profile.authenticated = true;
    state.profile.recoveryEmail = recoveryEmail;
    state.profile.resetCodeHash = "";
    state.profile.resetCodeExpiresAt = "";

    return { ok: true, message: "Acesso criado." };
  }

  function unlockAccess(pin) {
    const cleanedPin = normalizePin(pin);

    if (!state.profile.pinHash) {
      return { ok: false, message: "Crie seu acesso local primeiro." };
    }

    if (hashPin(cleanedPin) !== state.profile.pinHash) {
      return { ok: false, message: "PIN incorreto." };
    }

    state.profile.authenticated = true;
    return { ok: true, message: "Acesso liberado." };
  }

  function lockAccess() {
    state.profile.authenticated = false;
  }

  function requestPinReset(email) {
    const recoveryEmail = normalizeEmail(email);

    if (!state.profile.pinHash) {
      return { ok: false, message: "Crie seu acesso local primeiro." };
    }

    if (!isValidEmail(recoveryEmail)) {
      return { ok: false, message: "Informe um e-mail valido." };
    }

    if (!state.profile.recoveryEmail) {
      state.profile.recoveryEmail = recoveryEmail;
    } else if (recoveryEmail !== state.profile.recoveryEmail) {
      return { ok: false, message: "E-mail diferente do cadastrado." };
    }

    const code = createRecoveryCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    state.profile.resetCodeHash = hashRecoveryCode(code);
    state.profile.resetCodeExpiresAt = expiresAt;

    return {
      ok: true,
      code,
      email: recoveryEmail,
      expiresAt,
      message: "Codigo de recuperacao gerado."
    };
  }

  function resetAccessWithCode(payload) {
    const recoveryEmail = normalizeEmail(payload?.email);
    const code = normalizePin(payload?.code);
    const pin = normalizePin(payload?.pin);

    if (!state.profile.resetCodeHash || !state.profile.resetCodeExpiresAt) {
      return { ok: false, message: "Solicite um codigo antes de trocar o PIN." };
    }

    if (new Date(state.profile.resetCodeExpiresAt).getTime() < Date.now()) {
      state.profile.resetCodeHash = "";
      state.profile.resetCodeExpiresAt = "";
      return { ok: false, message: "Codigo expirado. Solicite outro." };
    }

    if (recoveryEmail !== state.profile.recoveryEmail) {
      return { ok: false, message: "E-mail diferente do cadastrado." };
    }

    if (hashRecoveryCode(code) !== state.profile.resetCodeHash) {
      return { ok: false, message: "Codigo incorreto." };
    }

    if (pin.length < 4) {
      return { ok: false, message: "Crie um PIN com pelo menos 4 numeros." };
    }

    state.profile.pinHash = hashPin(pin);
    state.profile.authenticated = true;
    state.profile.resetCodeHash = "";
    state.profile.resetCodeExpiresAt = "";

    return { ok: true, message: "PIN alterado." };
  }

  function togglePrivacy() {
    state.profile.privacy = !state.profile.privacy;
  }

  function applyState(nextState) {
    state.profile.name = nextState.profile.name;
    state.profile.initialBalance = nextState.profile.initialBalance;
    state.profile.privacy = nextState.profile.privacy;
    state.profile.pinHash = nextState.profile.pinHash;
    state.profile.authenticated = nextState.profile.authenticated;
    state.profile.recoveryEmail = nextState.profile.recoveryEmail;
    state.profile.resetCodeHash = nextState.profile.resetCodeHash;
    state.profile.resetCodeExpiresAt = nextState.profile.resetCodeExpiresAt;
    state.settings.activeMonth = nextState.settings.activeMonth;
    state.categories.splice(0, state.categories.length, ...nextState.categories);
    state.budgets.splice(0, state.budgets.length, ...nextState.budgets);
    state.transactions.splice(0, state.transactions.length, ...nextState.transactions);
  }

  function exportData() {
    const data = JSON.parse(JSON.stringify(state));
    data.profile.authenticated = false;
    data.profile.resetCodeHash = "";
    data.profile.resetCodeExpiresAt = "";

    return {
      app: "FinancePro",
      version: 2,
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      data
    };
  }

  function importData(payload) {
    try {
      const source = payload?.data || payload;
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        throw new Error("Invalid backup");
      }

      const imported = normalizeLoadedState(source);
      imported.profile.authenticated = state.profile.authenticated;
      imported.profile.pinHash = imported.profile.pinHash || state.profile.pinHash;
      imported.profile.recoveryEmail = imported.profile.recoveryEmail || state.profile.recoveryEmail;
      applyState(imported);
      return { ok: true, message: "Backup importado." };
    } catch {
      return { ok: false, message: "Nao foi possivel importar este arquivo." };
    }
  }

  function resetData() {
    const fresh = createDefaultState();
    applyState(fresh);
  }

  return {
    state,
    profileName,
    hasAccessPin,
    isAuthenticated,
    hasRecoveryEmail,
    activeMonth,
    activeMonthLabel,
    monthTransactions,
    monthExpenses,
    monthEntries,
    entriesTotal,
    expensesTotal,
    monthEntriesTotal,
    monthExpensesTotal,
    currentBalance,
    result,
    monthResult,
    transactionsNewest,
    biggestExpense,
    monthBiggestExpense,
    lastTransaction,
    monthBudgets,
    budgetTotal,
    budgetedSpending,
    budgetRemaining,
    budgetUsage,
    expenseRate,
    monthlyCategorySummary,
    groupedExpenses,
    biggestCategory,
    overBudgetCategories,
    unplannedCategories,
    cashFlowSeries,
    hasFinancialData,
    health,
    money,
    date,
    dateTime,
    toInputDate,
    categoryByName,
    setActiveMonth,
    addCategory,
    saveBudget,
    deleteBudget,
    upsertTransaction,
    addTransaction,
    deleteTransaction,
    saveProfile,
    setupAccess,
    unlockAccess,
    lockAccess,
    requestPinReset,
    resetAccessWithCode,
    togglePrivacy,
    exportData,
    importData,
    resetData
  };
});
