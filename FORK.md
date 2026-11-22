# PF2e Subsystems — fork stołu

Fork modułu [WBHarry/pf2e-subsystems](https://github.com/WBHarry/pf2e-subsystems) dla światów PF2e stołu. Praca idzie
na gałęzi `table`; `main` stoi tak jak u oryginału. Id modułu zostaje `pf2e-subsystems`, bo pod nim świat trzyma dane
podsystemów (ustawienia `pf2e-subsystems.*`).

## Czym różni się od oryginału

- Rzuty obronne (Wytrwałość, Refleks, Wola) są do wyboru w testach wszystkich podsystemów, obok umiejętności
  i Percepcji (oryginał: zgłoszenie #44).
- Obeznanie znane systemowi (tabela `PF2E.SpecificLore`) ma na przycisku rzutu swoją nazwę w języku klienta
  ("Obeznanie: Biblioteki", "Library Lore"); pole wpisu Obeznania podpowiada Obeznania systemu. Obeznanie spoza
  tabeli ma nazwę, którą daje mu system (ze sluga). `lib.loreCheckLabel(slug)` i `lib.systemLores()` dają to samo
  modułom zależnym.
- Poprawki: tytuł rzutu z nazwą umiejętności zamiast "undefined"; napisy szablonów spod kluczy językowych ("Research
  Points", "Add additional awareness breakpoint", "Max Attempts"); każda część widoku dostaje własną kopię kontekstu —
  pełny render (np. `lib.openSubsystemView("infiltration", id)`) pokazywał w infiltracji listę zamiast zdarzenia.
- `module.json` bez `manifest` i `download` oryginału, także w relacji wymagającej Theming, więc aktualizacja
  Foundry nie podmieni forka ani jego zależności oryginałem; wersja to wydanie oryginału z czwartym członem
  (`0.8.10.2`).

## Build i wdrożenie

```
npm ci
npm run package                      # Subsystems.js, CSS, paczka kompendium → dist/pf2e-subsystems
foundry-server deploy dist/pf2e-subsystems
```

`Subsystems.js` i `styles/pf2e-subsystems.css` to wynik builda, commitowany jak u oryginału. Środowisko testowe
dowiązuje `dist/pf2e-subsystems` w profilu `pl-pf2e-malevolence`; sprawdzenie widoków:
`foundry-testbench run pl-pf2e-malevolence <repo>/tests/views.scenario.js --no-canvas --user "Asystent MG"` (także
z `--language en`).

## Nowe wydanie oryginału

`git fetch upstream`, merge jego tagu albo `main` na `table`, `npm run package`, wersja w `module.json` — nowe
wydanie oryginału z `.1` — scenariusz widoków, deploy.
