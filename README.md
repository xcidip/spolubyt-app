# Spolubyt.cz – Hi-Fi Interaktivní Prototyp (ČZU PEF)

> **Předmět:** Interakční design (INFO5v / EIE64E / EIE94E / EIEF7E)  
> **Katedra:** Katedra informačních technologií, PEF ČZU v Praze  
> **Garant:** Ing. Josef Pavlíček, Ph.D.  
> **Téma:** Sdílení nákladů a správa společné domácnosti – Spolubyt.cz  
> **Tech Stack:** Tauri (Rust + Vue 3 + TypeScript + Tailwind CSS)

---

## 🚀 Rychlé spuštění pro uživatelské testování (Usability Testing)

Aplikace je plně interaktivní produkční SPA připravená jak pro **webové testování v prohlížeči**, tak jako **desktopová aplikace přes Tauri**.

### 1. Spuštění v prohlížeči (doporučeno pro rychlé testování)
```bash
cd spolubyt-app
npm install      # (již nainstalováno)
npm run dev
```
Aplikace běží na: **`http://localhost:5173/`**

### 2. Spuštění jako desktopová aplikace přes Tauri
```bash
cd spolubyt-app
npm run tauri dev
```

---

## 📋 Splnění požadavků zadání prototypu

| Požadavek ze zadání | Stav | Implementace v prototypu |
| :--- | :---: | :--- |
| **1. Funkční navigace mezi hlavními stránkami dle Task Graphu** | ✅ Splněno | Všech 10 uzlů z Mermaid diagramu (`DASH`, `EXPENSES`, `EXP_DETAIL`, `EXP_ADD`, `SETTLEMENT`, `QR_MODAL`, `CONFIRM_MODAL`, `ENERGY`, `METER_ADD`, `SETTINGS`) + `CART`. |
| **2. Filtrování a řazení v reálném čase** | ✅ Splněno | Období (11/2026, 10/2026, 09/2026), kategorie, plátce, stav úhrady, textové fulltextové vyhledávání a řazení dle sloupců (datum, částka, název) s okamžitým přepočtem celkového součtu. |
| **3. Detail položky s přepínáním záložek / fotografií** | ✅ Splněno | Dvousloupcový modál s rozpadem nákladů a 3 přepínatelnými záložkami (*Doklad/Účtenka*, *Položkový rozpad*, *Auditní stopa*) + celoobrazovkový Lightbox náhled. |
| **4. Košík s okamžitým přepočtem ceny a počtu kusů** | ✅ Splněno | Společný nákupní košík s tlačítky `+` / `-`, přidáváním a odebíráním položek, okamžitým přepočtem a možností 1-click převodu na společný výdaj. |
| **5. Dialog pro potvrzení akce** | ✅ Splněno | Přístupný modální konfirmační dialog pro smazání výdaje, vysypání košíku i obnovení výchozích dat s klávesovou zkratkou `Escape`. |
| **6. Zpětná vazba pro uživatele (notifikace / toasty)** | ✅ Splněno | Kontextový toast systém (úspěch, varování, info, chyba), konfety při vyrovnání dluhu, indikátory synchronizace a stavu splatnosti. |
| **7. Správa stavu a mock data** | ✅ Splněno | Reaktivní Vue 3 state composable `useSpolubyt` s automatickou perzistencí do `LocalStorage` a tlačítkem pro reset výchozích dat. |
| **8. Přístupnost a čistý moderní vzhled** | ✅ Splněno | Responzivní Tailwind rozvržení, sémantické HTML, ARIA dialogy, focus stavy a české SPAYD QR kódy generované na canvas. |

---

## 👥 Přepínání testovacích person (Role Switcher)

V pravém horním rohu navigace je k dispozici **přepínač aktivní persony**:
1. **Bc. Tomáš Beránek (Správce bytu / Master Tenant)** – spravuje kmenové parametry bytu, páruje platby, odesílá upomínky.
2. **Jakub Kovář (Pokoj 1, dluh 9 850 Kč – před splatností)** – testování pohledu spolubydlícího a generování platebního QR kódu.
3. **Eliška Malá (Pokoj 2, dluh 4 500 Kč – po splatnosti)** – testování upomínkového mechanismu a dlužných stavů.
4. **Martin Pospíšil (Pokoj 3, 0 Kč – vyrovnáno)** – testování bezdlužného profilu.

