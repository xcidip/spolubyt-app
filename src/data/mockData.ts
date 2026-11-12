import { 
  Roommate, 
  Expense, 
  DebtSettlement, 
  MeterReading, 
  CartItem, 
  ApartmentSettings,
  CleaningTaskDef,
  CleaningShift
} from '../types'

export const DEMO_TODAY = '2026-11-12'

export const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: 'user-tomas',
    name: 'Tomáš Beránek',
    role: 'Správce',
    email: 'tomas.beranek@example.com',
    phone: 'Demo – bez telefonu',
    roomName: 'Pokoj 4 (Pracovna)',
    roomAreaM2: 15.0,
    areaSharePct: 20.0,
    avatarColor: 'bg-emerald-600',
    avatarInitial: 'T',
    bankAccount: '123456789/0800',
    iban: 'CZ6508000000000123456789'
  },
  {
    id: 'user-jakub',
    name: 'Jakub Kovář',
    role: 'Člen',
    email: 'jakub.kovar@example.com',
    phone: 'Demo – bez telefonu',
    roomName: 'Pokoj 1 (Rohový)',
    roomAreaM2: 22.0,
    areaSharePct: 29.3,
    avatarColor: 'bg-blue-600',
    avatarInitial: 'J'
  },
  {
    id: 'user-eliska',
    name: 'Eliška Malá',
    role: 'Člen',
    email: 'eliska.mala@example.com',
    phone: 'Demo – bez telefonu',
    roomName: 'Pokoj 2 (Balkón)',
    roomAreaM2: 20.0,
    areaSharePct: 26.7,
    avatarColor: 'bg-purple-600',
    avatarInitial: 'E'
  },
  {
    id: 'user-martin',
    name: 'Martin Pospíšil',
    role: 'Člen',
    email: 'martin.pospisil@example.com',
    phone: 'Demo – bez telefonu',
    roomName: 'Pokoj 3 (Střední)',
    roomAreaM2: 18.0,
    areaSharePct: 24.0,
    avatarColor: 'bg-amber-600',
    avatarInitial: 'M'
  }
]

export const INITIAL_SETTINGS: ApartmentSettings = {
  name: 'Dejvice - Thákurova 4+1',
  address: 'Thákurova 12, 160 00 Praha 6 - Dejvice',
  accountNumber: '123456789 / 0800 (Česká spořitelna)',
  iban: 'CZ6508000000000123456789',
  monthlyRent: 28000,
  monthlyUtilities: 8600,
  dueDayOfMonth: 10,
  rules: {
    rentKey: 'BY_AREA',
    energyKey: 'EQUAL',
    suppliesKey: 'EQUAL'
  }
}

export const INITIAL_SETTLEMENTS: DebtSettlement[] = [
  {
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    roomName: 'Pokoj 1 (22 m², 29.3 %)',
    roomAreaM2: 22.0,
    areaSharePct: 29.3,
    totalDebt: 9850,
    breakdown: {
      rent: 8204,
      energy: 1521,
      other: 125
    },
    dueDate: '2026-11-10',
    daysOverdue: 0,
    status: 'PŘED_SPLATNOSTÍ'
  },
  {
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    roomName: 'Pokoj 2 (20 m², 26.7 %)',
    roomAreaM2: 20.0,
    areaSharePct: 26.7,
    totalDebt: 4500,
    breakdown: {
      rent: 3790,
      energy: 400,
      drogerie: 310
    },
    dueDate: '2026-11-01',
    daysOverdue: 4,
    status: 'PO_SPLATNOSTI',
    lastReminderSent: '03. 11. 2026 09:15 e-mailem'
  },
  {
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    roomName: 'Pokoj 3 (18 m², 24.0 %)',
    roomAreaM2: 18.0,
    areaSharePct: 24.0,
    totalDebt: 0,
    breakdown: {
      rent: 0,
      energy: 0
    },
    dueDate: '2026-11-10',
    daysOverdue: 0,
    status: 'VYROVNÁNO'
  }
]

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    code: 'VYD-2026-11-04',
    title: 'Velký nákup drogerie a čistících prostředků',
    category: 'Drogerie',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-11-04',
    totalAmount: 1240,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 310, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 310, status: 'UHRAZENO', settledDate: '05. 11. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 310, status: 'DLUŽÍ' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 310, status: 'UHRAZENO', settledDate: '04. 11. 2026' }
    ],
    receiptName: 'uctenka_dm_drogerie.jpg',
    receiptType: 'JPG',
    receiptItems: [
      { id: 'item-1', name: 'Prací gel Ariel Sensitive 3.5 l', price: 349, qty: 1 },
      { id: 'item-2', name: 'Tablety do myčky Somat All-in-1', price: 420, qty: 1 },
      { id: 'item-3', name: 'Toaletní papír 3-vrstvý 16 ks', price: 189, qty: 1 },
      { id: 'item-4', name: 'Čistič povrchů a koupelen Savo', price: 110, qty: 1 },
      { id: 'item-5', name: 'Pytle na odpad 60 l zatahovací', price: 82, qty: 1 },
      { id: 'item-6', name: 'Poplatek za papírovou tašku DM', price: 90, qty: 1 }
    ],
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '04. 11. 2026 18:22'
    },
    status: 'ČÁSTEČNĚ'
  },
  {
    id: 'exp-2',
    code: 'VYD-2026-11-02',
    title: 'Internet optika 1 Gb/s (Vodafone)',
    category: 'Služby',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-11-02',
    totalAmount: 500,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 125, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 125, status: 'DLUŽÍ' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 125, status: 'UHRAZENO', settledDate: '03. 11. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 125, status: 'UHRAZENO', settledDate: '02. 11. 2026' }
    ],
    receiptName: 'faktura_vodafone_112026.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '02. 11. 2026 10:15'
    },
    status: 'ČÁSTEČNĚ'
  },
  {
    id: 'exp-3',
    code: 'VYD-2026-11-01',
    title: 'Nájemné majiteli (Listopad 2026) – zbývající část',
    category: 'Bydlení',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-11-01',
    totalAmount: 24314,
    calculationKey: 'CUSTOM',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 5600, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 8204, status: 'DLUŽÍ' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 3790, status: 'PO_SPLATNOSTI' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 6720, status: 'UHRAZENO', settledDate: '01. 11. 2026' }
    ],
    receiptName: 'najemni_smlouva_potvrzeni_11.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '01. 11. 2026 08:30'
    },
    status: 'ČÁSTEČNĚ'
  },
  {
    id: 'exp-4',
    code: 'VYD-2026-10-28',
    title: 'Čistící prostředky na koupelnu a WC',
    category: 'Drogerie',
    payerId: 'user-eliska',
    payerName: 'Eliška Malá',
    date: '2026-10-28',
    totalAmount: 480,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 120, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 120, status: 'UHRAZENO', settledDate: '29. 10. 2026' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 120, status: 'UHRAZENO', settledDate: '29. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 120, status: 'UHRAZENO', settledDate: '29. 10. 2026' }
    ],
    receiptName: 'uctenka_rossmann.jpg',
    receiptType: 'JPG',
    audit: {
      createdBy: 'Eliška Malá',
      createdAt: '28. 10. 2026 19:40'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-5',
    code: 'VYD-2026-10-25',
    title: 'Oprava žaluzie v obývacím pokoji',
    category: 'Údržba',
    payerId: 'user-jakub',
    payerName: 'Jakub Kovář',
    date: '2026-10-25',
    totalAmount: 850,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 212.5, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 212.5, status: 'UHRAZENO', settledDate: '26. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 212.5, status: 'UHRAZENO', settledDate: '26. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 212.5, status: 'UHRAZENO', settledDate: '26. 10. 2026' }
    ],
    audit: {
      createdBy: 'Jakub Kovář',
      createdAt: '25. 10. 2026 16:10'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-6',
    code: 'VYD-2026-10-15',
    title: 'Měsíční záloha na elektřinu (ČEZ Prodej)',
    category: 'Energie',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-10-15',
    totalAmount: 3200,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 800, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 800, status: 'UHRAZENO', settledDate: '16. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 800, status: 'UHRAZENO', settledDate: '16. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 800, status: 'UHRAZENO', settledDate: '15. 10. 2026' }
    ],
    receiptName: 'zalohovy_list_cez_10.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '15. 10. 2026 09:00'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-7',
    code: 'VYD-2026-10-007',
    title: 'Měsíční záloha na plyn (innogy)',
    category: 'Energie',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-10-15',
    totalAmount: 2330,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 582.5, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 582.5, status: 'UHRAZENO', settledDate: '16. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 582.5, status: 'UHRAZENO', settledDate: '16. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 582.5, status: 'UHRAZENO', settledDate: '15. 10. 2026' }
    ],
    receiptName: 'zaloha_innogy_10.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '15. 10. 2026 09:05'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-8',
    code: 'VYD-2026-10-20',
    title: 'Nákup žárovek a prodlužovacího kabelu',
    category: 'Údržba',
    payerId: 'user-martin',
    payerName: 'Martin Pospíšil',
    date: '2026-10-20',
    totalAmount: 340,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 85, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 85, status: 'UHRAZENO', settledDate: '21. 10. 2026' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 85, status: 'UHRAZENO', settledDate: '21. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 85, status: 'UHRAZENO', settledDate: '21. 10. 2026' }
    ],
    receiptName: 'obi_uctenka_zarovky.jpg',
    receiptType: 'JPG',
    audit: {
      createdBy: 'Martin Pospíšil',
      createdAt: '20. 10. 2026 14:15'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-9',
    code: 'VYD-2026-10-18',
    title: 'Společný nákup zrnkové kávy a čaje',
    category: 'Jídlo',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-10-18',
    totalAmount: 620,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 155, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 155, status: 'UHRAZENO', settledDate: '19. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 155, status: 'UHRAZENO', settledDate: '19. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 155, status: 'UHRAZENO', settledDate: '19. 10. 2026' }
    ],
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '18. 10. 2026 17:30'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-10',
    code: 'VYD-2026-10-10',
    title: 'Odvoz staré skříně do sběrného dvora',
    category: 'Služby',
    payerId: 'user-jakub',
    payerName: 'Jakub Kovář',
    date: '2026-10-10',
    totalAmount: 600,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 150, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 150, status: 'UHRAZENO', settledDate: '11. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 150, status: 'UHRAZENO', settledDate: '11. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 150, status: 'UHRAZENO', settledDate: '11. 10. 2026' }
    ],
    audit: {
      createdBy: 'Jakub Kovář',
      createdAt: '10. 10. 2026 11:20'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-11',
    code: 'VYD-2026-10-05',
    title: 'Měsíční záloha na vodné a stočné (PVK)',
    category: 'Energie',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-10-05',
    totalAmount: 1800,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 450, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 450, status: 'UHRAZENO', settledDate: '06. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 450, status: 'UHRAZENO', settledDate: '06. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 450, status: 'UHRAZENO', settledDate: '06. 10. 2026' }
    ],
    receiptName: 'pvk_predpis_10.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '05. 10. 2026 08:45'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-12',
    code: 'VYD-2026-10-02',
    title: 'Týdenní nákup základních potravin',
    category: 'Jídlo',
    payerId: 'user-eliska',
    payerName: 'Eliška Malá',
    date: '2026-10-02',
    totalAmount: 1150,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 287.5, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 287.5, status: 'UHRAZENO', settledDate: '03. 10. 2026' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 287.5, status: 'UHRAZENO', settledDate: '03. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 287.5, status: 'UHRAZENO', settledDate: '03. 10. 2026' }
    ],
    receiptName: 'kaufland_uctenka_0210.jpg',
    receiptType: 'JPG',
    audit: {
      createdBy: 'Eliška Malá',
      createdAt: '02. 10. 2026 20:10'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-13',
    code: 'VYD-2026-09-28',
    title: 'Nové filtry do digestoře a myčky nádobí',
    category: 'Drogerie',
    payerId: 'user-martin',
    payerName: 'Martin Pospíšil',
    date: '2026-09-28',
    totalAmount: 410,
    calculationKey: 'EQUAL',
    shares: [
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 102.5, status: 'PLÁTCE' },
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 102.5, status: 'UHRAZENO', settledDate: '29. 09. 2026' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 102.5, status: 'UHRAZENO', settledDate: '29. 09. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 102.5, status: 'UHRAZENO', settledDate: '29. 09. 2026' }
    ],
    audit: {
      createdBy: 'Martin Pospíšil',
      createdAt: '28. 09. 2026 15:40'
    },
    status: 'UHRAZENO'
  },
  {
    id: 'exp-14',
    code: 'VYD-2026-10-014',
    title: 'Nájemné majiteli (Říjen 2026)',
    category: 'Bydlení',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-10-01',
    totalAmount: 28000,
    calculationKey: 'BY_AREA',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 5600, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 8204, status: 'UHRAZENO', settledDate: '02. 10. 2026' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 7476, status: 'UHRAZENO', settledDate: '02. 10. 2026' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 6720, status: 'UHRAZENO', settledDate: '01. 10. 2026' }
    ],
    receiptName: 'najemni_smlouva_potvrzeni_10.pdf',
    receiptType: 'PDF',
    audit: {
      createdBy: 'Tomáš Beránek',
      createdAt: '01. 10. 2026 08:30'
    },
    status: 'UHRAZENO'
  }
  ,{
    id: 'exp-15',
    code: 'VYD-2026-11-015',
    title: 'Zálohy na energie – listopad 2026',
    category: 'Energie',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-11-01',
    totalAmount: 8600,
    calculationKey: 'CUSTOM',
    shares: [
      { roommateId: 'user-tomas', roommateName: 'Tomáš Beránek', amount: 4529, status: 'PLÁTCE' },
      { roommateId: 'user-jakub', roommateName: 'Jakub Kovář', amount: 1521, status: 'DLUŽÍ' },
      { roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 400, status: 'PO_SPLATNOSTI' },
      { roommateId: 'user-martin', roommateName: 'Martin Pospíšil', amount: 2150, status: 'UHRAZENO', settledDate: '01. 11. 2026' },
    ],
    audit: { createdBy: 'Tomáš Beránek', createdAt: '01. 11. 2026 08:31' },
    status: 'ČÁSTEČNĚ',
  },
  {
    id: 'exp-16',
    code: 'VYD-2026-11-016',
    title: 'Nájemné listopad – již uhrazená část Elišky',
    category: 'Bydlení',
    payerId: 'user-tomas',
    payerName: 'Tomáš Beránek',
    date: '2026-11-01',
    totalAmount: 3686,
    calculationKey: 'CUSTOM',
    shares: [{ roommateId: 'user-eliska', roommateName: 'Eliška Malá', amount: 3686, status: 'UHRAZENO', settledDate: '01. 11. 2026' }],
    audit: { createdBy: 'Tomáš Beránek', createdAt: '01. 11. 2026 08:32' },
    status: 'UHRAZENO',
  },
]

export const INITIAL_METERS: MeterReading[] = [
  {
    id: 'meter-elec-1',
    type: 'ELEKTŘINA',
    date: '2026-10-31',
    value: 14820,
    unit: 'kWh',
    delta: 185,
    recordedBy: 'Tomáš Beránek',
    photoUrl: '/img/meter_elec.jpg',
    note: 'Řádný měsíční odečet před topnou sezónou'
  },
  {
    id: 'meter-gas-1',
    type: 'PLYN',
    date: '2026-10-31',
    value: 3410,
    unit: 'm³',
    delta: 28,
    recordedBy: 'Tomáš Beránek',
    photoUrl: '/img/meter_gas.jpg',
    note: 'Pravidelný odečet plynoměru'
  },
  {
    id: 'meter-cold-1',
    type: 'STUDENÁ_VODA',
    date: '2026-10-31',
    value: 284,
    unit: 'm³',
    delta: 6,
    recordedBy: 'Tomáš Beránek',
    note: 'Vodárna na chodbě'
  },
  {
    id: 'meter-hot-1',
    type: 'TEPLÁ_VODA',
    date: '2026-10-31',
    value: 142,
    unit: 'm³',
    delta: 4,
    recordedBy: 'Tomáš Beránek',
    note: 'Teplá voda TUV'
  },
  {
    id: 'meter-elec-0',
    type: 'ELEKTŘINA',
    date: '2026-09-30',
    value: 14635,
    unit: 'kWh',
    delta: 172,
    recordedBy: 'Jakub Kovář',
    note: 'Září - v normě'
  },
  {
    id: 'meter-gas-0',
    type: 'PLYN',
    date: '2026-09-30',
    value: 3382,
    unit: 'm³',
    delta: 24,
    recordedBy: 'Jakub Kovář',
    note: 'Plyn září'
  },
  {
    id: 'meter-cold-0',
    type: 'STUDENÁ_VODA',
    date: '2026-09-30',
    value: 278,
    unit: 'm³',
    delta: 5,
    recordedBy: 'Martin Pospíšil',
    note: 'Voda září'
  },
  {
    id: 'meter-hot-0',
    type: 'TEPLÁ_VODA',
    date: '2026-09-30',
    value: 138,
    unit: 'm³',
    delta: 4,
    recordedBy: 'Martin Pospíšil',
    note: 'TUV září'
  }
]

export const ENERGY_MONTHLY_HISTORY = [
  { month: '05/26', value: 138, allowance: 160 },
  { month: '06/26', value: 145, allowance: 160 },
  { month: '07/26', value: 122, allowance: 160 },
  { month: '08/26', value: 130, allowance: 160 },
  { month: '09/26', value: 172, allowance: 160 },
  { month: '10/26', value: 185, allowance: 160 },
]

export const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'cart-1',
    name: 'Tablety do myčky Somat All-in-1 (75 ks)',
    category: 'Drogerie',
    unitPrice: 349,
    qty: 1,
    addedBy: 'Tomáš Beránek',
    addedAt: 'Před 2 dny',
    isPurchased: true,
    purchasedBy: 'Jakub Kovář',
    purchasedAt: 'Včera'
  },
  {
    id: 'cart-2',
    name: 'Toaletní papír 3-vrstvý (16 rolí)',
    category: 'Drogerie',
    unitPrice: 189,
    qty: 2,
    addedBy: 'Eliška Malá',
    addedAt: 'Včera',
    isPurchased: false
  },
  {
    id: 'cart-3',
    name: 'Zatahovací pytle na odpad 60 l',
    category: 'Drogerie',
    unitPrice: 82,
    qty: 2,
    addedBy: 'Jakub Kovář',
    addedAt: 'Dnes'
  },
  {
    id: 'cart-4',
    name: 'Čistící sprej na mastnotu Cillit Bang',
    category: 'Drogerie',
    unitPrice: 115,
    qty: 1,
    addedBy: 'Martin Pospíšil',
    addedAt: 'Dnes'
  },
  {
    id: 'cart-5',
    name: 'LED žárovka E27 teplá bílá 10W',
    category: 'Údržba',
    unitPrice: 79,
    qty: 3,
    addedBy: 'Tomáš Beránek',
    addedAt: 'Před 3 dny'
  }
]

export const CLEANING_TASK_DEFS: CleaningTaskDef[] = [
  {
    key: 'KITCHEN',
    title: 'Uklízení kuchyně a myčky',
    shortTitle: 'Kuchyň a myčka',
    description: 'Pravidelný týdenní úklid kuchyňské linky, varné desky, myčky na nádobí a jídelního stolu.',
    subtasks: [
      'Vyklidit čisté nádobí a zapnout plnou myčku',
      'Setřít a odmastit varnou desku a linku',
      'Umýt dřez, baterii a vyčistit odtokové sítko',
      'Utřít jídelní stůl a vynést bioodpad'
    ],
    icon: 'utensils',
    color: 'emerald'
  },
  {
    key: 'BATHROOM',
    title: 'Koupelna a toaleta',
    shortTitle: 'Koupelna a WC',
    description: 'Důkladná dezinfekce toalety, vyčištění sprchy/vany, umyvadla a vyleštění zrcadel.',
    subtasks: [
      'Dezinfikovat a umýt toaletní mísu i prkénko',
      'Vyčistit sprchový kout / vanu a odstranit vodní kámen',
      'Umýt umyvadlo a vyleštit zrcadlo',
      'Doplnit toaletní papír a vyměnit ručníky'
    ],
    icon: 'bath',
    color: 'sky'
  },
  {
    key: 'CORRIDOR',
    title: 'Chodba a vysávání',
    shortTitle: 'Chodba a vysávání',
    description: 'Vyluxování všech společných prostor bytu, vytření podlahy a úklid předsíně s botníkem.',
    subtasks: [
      'Vyluxovat koberce a podlahy ve společných prostorách',
      'Vytřít podlahu v předsíni a chodbě namokro',
      'Srovnat botník a vyklepat vstupní rohožku',
      'Otřít prach ze společných komod a parapetů'
    ],
    icon: 'sparkles',
    color: 'amber'
  },
  {
    key: 'TRASH',
    title: 'Odpadky a třídění',
    shortTitle: 'Odpadky a třídění',
    description: 'Vynesení směsného i tříděného odpadu do venkovních kontejnerů a výměna sáčků.',
    subtasks: [
      'Vynést směsný komunální odpad do černé popelnice',
      'Vytřídit a vynést plast, papír, plechovky a sklo',
      'Otřít a vydezinfikovat odpadkové koše',
      'Založit nové pevné pytle do všech košů'
    ],
    icon: 'trash',
    color: 'purple'
  }
]

export const INITIAL_CLEANING_SHIFTS: CleaningShift[] = [
  // Week 44 (Past week, complete)
  {
    id: 'shift-w44-kitchen',
    weekNumber: 44,
    year: 2026,
    weekLabel: 'Týden 44 (26. 10. – 1. 11. 2026)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    taskKey: 'KITCHEN',
    taskTitle: 'Uklízení kuchyně a myčky',
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    isCompleted: true,
    completedAt: '01. 11. 2026 18:30',
    completedBy: 'Martin Pospíšil'
  },
  {
    id: 'shift-w44-bathroom',
    weekNumber: 44,
    year: 2026,
    weekLabel: 'Týden 44 (26. 10. – 1. 11. 2026)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    taskKey: 'BATHROOM',
    taskTitle: 'Koupelna a toaleta',
    roommateId: 'user-tomas',
    roommateName: 'Tomáš Beránek',
    isCompleted: true,
    completedAt: '31. 10. 2026 14:15',
    completedBy: 'Tomáš Beránek'
  },
  {
    id: 'shift-w44-corridor',
    weekNumber: 44,
    year: 2026,
    weekLabel: 'Týden 44 (26. 10. – 1. 11. 2026)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    taskKey: 'CORRIDOR',
    taskTitle: 'Chodba a vysávání',
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    isCompleted: true,
    completedAt: '01. 11. 2026 11:20',
    completedBy: 'Jakub Kovář'
  },
  {
    id: 'shift-w44-trash',
    weekNumber: 44,
    year: 2026,
    weekLabel: 'Týden 44 (26. 10. – 1. 11. 2026)',
    startDate: '2026-10-26',
    endDate: '2026-11-01',
    taskKey: 'TRASH',
    taskTitle: 'Odpadky a třídění',
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    isCompleted: true,
    completedAt: '30. 10. 2026 20:00',
    completedBy: 'Eliška Malá'
  },

  // Week 45 (Current active week)
  {
    id: 'shift-w45-kitchen',
    weekNumber: 45,
    year: 2026,
    weekLabel: 'Týden 45 (2. 11. – 8. 11. 2026)',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    taskKey: 'KITCHEN',
    taskTitle: 'Uklízení kuchyně a myčky',
    roommateId: 'user-tomas',
    roommateName: 'Tomáš Beránek',
    isCompleted: true,
    completedAt: '04. 11. 2026 21:15',
    completedBy: 'Tomáš Beránek',
    notes: 'Myčka zkontrolována, linka otřena.'
  },
  {
    id: 'shift-w45-bathroom',
    weekNumber: 45,
    year: 2026,
    weekLabel: 'Týden 45 (2. 11. – 8. 11. 2026)',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    taskKey: 'BATHROOM',
    taskTitle: 'Koupelna a toaleta',
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    isCompleted: false
  },
  {
    id: 'shift-w45-corridor',
    weekNumber: 45,
    year: 2026,
    weekLabel: 'Týden 45 (2. 11. – 8. 11. 2026)',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    taskKey: 'CORRIDOR',
    taskTitle: 'Chodba a vysávání',
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    isCompleted: false
  },
  {
    id: 'shift-w45-trash',
    weekNumber: 45,
    year: 2026,
    weekLabel: 'Týden 45 (2. 11. – 8. 11. 2026)',
    startDate: '2026-11-02',
    endDate: '2026-11-08',
    taskKey: 'TRASH',
    taskTitle: 'Odpadky a třídění',
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    isCompleted: true,
    completedAt: '05. 11. 2026 19:40',
    completedBy: 'Martin Pospíšil',
    notes: 'Vynesen plast i papír, nový pytel v koši.'
  },

  // Week 46 (Upcoming week)
  {
    id: 'shift-w46-kitchen',
    weekNumber: 46,
    year: 2026,
    weekLabel: 'Týden 46 (9. 11. – 15. 11. 2026)',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    taskKey: 'KITCHEN',
    taskTitle: 'Uklízení kuchyně a myčky',
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    isCompleted: false
  },
  {
    id: 'shift-w46-bathroom',
    weekNumber: 46,
    year: 2026,
    weekLabel: 'Týden 46 (9. 11. – 15. 11. 2026)',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    taskKey: 'BATHROOM',
    taskTitle: 'Koupelna a toaleta',
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    isCompleted: false
  },
  {
    id: 'shift-w46-corridor',
    weekNumber: 46,
    year: 2026,
    weekLabel: 'Týden 46 (9. 11. – 15. 11. 2026)',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    taskKey: 'CORRIDOR',
    taskTitle: 'Chodba a vysávání',
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    isCompleted: false
  },
  {
    id: 'shift-w46-trash',
    weekNumber: 46,
    year: 2026,
    weekLabel: 'Týden 46 (9. 11. – 15. 11. 2026)',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
    taskKey: 'TRASH',
    taskTitle: 'Odpadky a třídění',
    roommateId: 'user-tomas',
    roommateName: 'Tomáš Beránek',
    isCompleted: false
  },

  // Week 47 (Upcoming week +2)
  {
    id: 'shift-w47-kitchen',
    weekNumber: 47,
    year: 2026,
    weekLabel: 'Týden 47 (16. 11. – 22. 11. 2026)',
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    taskKey: 'KITCHEN',
    taskTitle: 'Uklízení kuchyně a myčky',
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    isCompleted: false
  },
  {
    id: 'shift-w47-bathroom',
    weekNumber: 47,
    year: 2026,
    weekLabel: 'Týden 47 (16. 11. – 22. 11. 2026)',
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    taskKey: 'BATHROOM',
    taskTitle: 'Koupelna a toaleta',
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    isCompleted: false
  },
  {
    id: 'shift-w47-corridor',
    weekNumber: 47,
    year: 2026,
    weekLabel: 'Týden 47 (16. 11. – 22. 11. 2026)',
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    taskKey: 'CORRIDOR',
    taskTitle: 'Chodba a vysávání',
    roommateId: 'user-tomas',
    roommateName: 'Tomáš Beránek',
    isCompleted: false
  },
  {
    id: 'shift-w47-trash',
    weekNumber: 47,
    year: 2026,
    weekLabel: 'Týden 47 (16. 11. – 22. 11. 2026)',
    startDate: '2026-11-16',
    endDate: '2026-11-22',
    taskKey: 'TRASH',
    taskTitle: 'Odpadky a třídění',
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    isCompleted: false
  },

  // Week 48 (Upcoming week +3)
  {
    id: 'shift-w48-kitchen',
    weekNumber: 48,
    year: 2026,
    weekLabel: 'Týden 48 (23. 11. – 29. 11. 2026)',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    taskKey: 'KITCHEN',
    taskTitle: 'Uklízení kuchyně a myčky',
    roommateId: 'user-martin',
    roommateName: 'Martin Pospíšil',
    isCompleted: false
  },
  {
    id: 'shift-w48-bathroom',
    weekNumber: 48,
    year: 2026,
    weekLabel: 'Týden 48 (23. 11. – 29. 11. 2026)',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    taskKey: 'BATHROOM',
    taskTitle: 'Koupelna a toaleta',
    roommateId: 'user-tomas',
    roommateName: 'Tomáš Beránek',
    isCompleted: false
  },
  {
    id: 'shift-w48-corridor',
    weekNumber: 48,
    year: 2026,
    weekLabel: 'Týden 48 (23. 11. – 29. 11. 2026)',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    taskKey: 'CORRIDOR',
    taskTitle: 'Chodba a vysávání',
    roommateId: 'user-jakub',
    roommateName: 'Jakub Kovář',
    isCompleted: false
  },
  {
    id: 'shift-w48-trash',
    weekNumber: 48,
    year: 2026,
    weekLabel: 'Týden 48 (23. 11. – 29. 11. 2026)',
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    taskKey: 'TRASH',
    taskTitle: 'Odpadky a třídění',
    roommateId: 'user-eliska',
    roommateName: 'Eliška Malá',
    isCompleted: false
  }
]


