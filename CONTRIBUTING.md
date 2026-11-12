# Jak přispívat do projektu Spolubyt 🤝

Děkujeme za váš zájem přispět do projektu **Spolubyt**! Každý příspěvek – ať už jde o nahlášení chyby, vylepšení dokumentace, návrh na novou funkci nebo samotný kód – je velmi vítán.

Tento dokument shrnuje doporučené postupy a pravidla pro hladkou spolupráci.

---

## 📌 Kodex chování

Tento projekt se řídí zásadami [Contributor Covenant](CODE_OF_CONDUCT.md). Účastí v diskuzích, zadáváním issues nebo zasíláním kódu se zavazujete tyto zásady dodržovat a jednat s respektem vůči všem členům komunity.

---

## 🐞 Hlášení chyb a návrhy na vylepšení

Než vytvoříte nové hlášení, ověřte prosím v sekci [Issues](https://github.com/xcidip/spolubyt-app/issues), zda se stejný problém nebo návrh již neřeší.

### Nahlášení chyby (Bug report)
Pro hlášení chyb použijte připravenou šablonu **Bug report**. Uveďte:
- Stručný a výstižný popis chyby.
- Přesné kroky k reprodukci (včetně aktivní role/uživatele).
- Očekávané vs. reálné chování.
- Verzi prohlížeče / operačního systému.
- Snímek obrazovky nebo záznam v konzoli (pokud je k dispozici).

### Návrh na vylepšení (Feature request)
Pro návrh nové funkčnosti využijte šablonu **Feature request**. Uveďte:
- Jaký problém nová funkce řeší.
- Jak by se měla chovat a jak zapadá do stávajícího Task Graphu / rozhraní.
- Případné wireframy, mockupy či alternativní návrhy.

---

## 💻 Vývojové prostředí a spuštění

Aplikace je postavena na stacku **Vue 3 (Composition API)**, **TypeScript**, **Tailwind CSS**, **Vite** a **Tauri 2**.

### Požadavky
- **Node.js** v20.x nebo novější
- **npm** v10.x nebo novější
- *(Volitelné pro Tauri)* Rust a systémové závislosti Tauri dle [dokumentace Tauri](https://tauri.app/start/)

### Krok za krokem
1. **Forkněte a naklonujte repozitář:**
   ```bash
   git clone https://github.com/xcidip/spolubyt-app.git
   cd spolubyt-app
   ```

2. **Nainstalujte závislosti:**
   ```bash
   npm install
   ```

3. **Spusťte vývojový server:**
   ```bash
   npm run dev
   ```
   Aplikace běží na `http://localhost:5173/`.

4. **Spuštění testů:**
   Před odesláním jakýchkoli změn vždy spusťte sadu E2E testů:
   ```bash
   npm test
   ```

5. **Kontrola typů a produkční sestavení:**
   ```bash
   npm run build
   ```

---

## 📐 Pravidla pro kód a architekturu

- **Komponenty a Vue 3:** Používejte zásadně Single File Components (SFC) s `<script setup lang="ts">`.
- **Typová bezpečnost:** Důsledně definujte TypeScript rozhraní v `src/types/index.ts`. Vyhýbejte se typu `any`.
- **Stylování:** Kód stylujte výhradně pomocí utility tříd **Tailwind CSS**. Dodržujte konzistentní barevnou paletu (primární smaragdová `#22C55E`, stavové barvy pro finance a úklid).
- **Správa stavu:** Centrální aplikační logika a perzistence do `localStorage` je soustředěna v `src/composables/useSpolubyt.ts`.
- **Přístupnost (a11y):** Dbejte na sémantické tagy (`<button>`, `<main>`, `<dialog>`), klávesové zkratky (např. zavírání modálů klávesou `Escape`) a kontrastní barvy.
- **Formátování:** Udržujte kód čistý, čitelný a odsazený 2 mezerami.

---

## 🌿 Práce s Gitem a Pull Requesty

1. **Vytvořte tematickou větev (branch)** z aktuálního `main`:
   ```bash
   git checkout -b feat/nova-funkcionalita
   # nebo
   git checkout -b fix/oprava-vypoctu
   ```

2. **Dodržujte konvenci commit zpráv (Conventional Commits):**
   - `feat:` nová funkcionalita (např. `feat: pridani exportu do CSV`)
   - `fix:` oprava chyby (např. `fix: oprava zaokrouhlovani v SPAYD retezci`)
   - `docs:` úprava dokumentace
   - `style:` formátování, oprava mezer, drobné CSS
   - `refactor:` úprava kódu bez změny funkčnosti
   - `test:` přidání nebo oprava testů
   - `chore:` údržba závislostí, konfigurační soubory

3. **Před vytvořením Pull Requestu ověřte:**
   - [ ] `npm test` prochází bez chyb.
   - [ ] `npm run build` projde bez TypeScript chyb.
   - [ ] Větev je rebasovaná/sloučená s aktuálním `main`.

4. **Otevřete Pull Request:**
   - Vyplňte připravenou šablonu Pull Requestu.
   - Stručně vysvětlete motivaci a přínos změny.
   - Pokud se změnilo uživatelské rozhraní, přiložte screenshoty.

Děkujeme, že pomáháte dělat Spolubyt ještě lepším! 🚀

