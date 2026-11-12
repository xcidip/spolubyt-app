## 📝 Popis změn

<!-- Popište stručně a srozumitelně podstatu a motivaci změn obsažených v tomto Pull Requestu. -->

## 🎯 Typ změny

- [ ] 🐛 Oprava chyby (`fix`)
- [ ] ✨ Nová funkcionalita (`feat`)
- [ ] 💄 Úprava vzhledu / UI / UX (`style`)
- [ ] ♻️ Refaktoring kódu (`refactor`)
- [ ] ⚡ Optimalizace výkonu (`perf`)
- [ ] 📝 Úprava dokumentace (`docs`)
- [ ] 🧪 Přidání nebo oprava testů (`test`)
- [ ] 🔧 Údržba / konfigurace / CI (`chore`)

## 🔗 Související Issue

<!-- Pokud tento PR řeší existující issue, uveďte např. Closes #123 -->
Closes #

## 📸 Snímky obrazovky / Vizuální porovnání

<!-- Pokud došlo ke změnám v uživatelském rozhraní, vložte sem náhledy před a po. -->

| Před změnami | Po změnách |
| --- | --- |
| *(žádné)* | *(žádné)* |

## ✅ Kontrolní seznam před sloučením (Checklist)

- [ ] Kód odpovídá zvyklostem projektu (Vue 3 Composition API, TypeScript, Tailwind CSS)
- [ ] Změny byly lokálně otestovány v prohlížeči (případně v Tauri okně)
- [ ] Typová kontrola a build proběhly bez chyb: `npm run build`
- [ ] Všechny E2E testy úspěšně prochází: `npm test`
- [ ] Verze aplikace je synchronizována ve všech šesti místech dle AGENTS.md (kromě docs-only změn)
- [ ] Při změně persistovaného tvaru byl zvýšen storage prefix
- [ ] Funkcionalita nezpůsobuje poškození dat uložených v `localStorage`
- [ ] Zajištěna přístupnost (a11y): modály jdou zavřít klávesou `Escape`, interaktivní prvky mají focus stav

