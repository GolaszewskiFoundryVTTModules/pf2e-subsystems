// foundry-testbench scenario (profile with this module linked as a dev build, e.g. pl-pf2e-malevolence):
//   foundry-testbench run pl-pf2e-malevolence <repo>/tests/views.scenario.js --no-canvas --user "Asystent MG"
// Renders research, infiltration and influence events holding a skill, a system lore, an unknown lore and a saving
// throw, in play and edit mode, and checks: every check has a roll button; a system lore's button carries the
// lore's label in the client's language; a save is offered among the options and rolls as one; lore inputs suggest
// system lores; no roll title says "undefined"; no unkeyed template string. World settings are restored at the end.
const MODULE_ID = "pf2e-subsystems";
const lib = game.modules.get(MODULE_ID).lib;
const problems = [];
const fail = (message) => problems.push(message);

const CHECKS = [
  { skill: "diplomacy", lore: false },
  { skill: "library-lore", lore: true },
  { skill: "ghost-lore", lore: true },
  { skill: "will", lore: false },
];
const skills = (extra = () => ({})) => Object.fromEntries(CHECKS.map((check, i) => [`s${i + 1}`,
  { id: `s${i + 1}`, skill: check.skill, lore: check.lore, action: "", variant: "", label: "", ...extra(check) }]));
const base = (id, name) => ({ id, position: 99, name, version: "0.8.10", background: "icons/svg/book.svg", hidden: false });
const leveled = () => ({ difficulty: { leveledDC: false, DC: 18 } });

const events = {
  research: { ...base("bench-research", "Bench Research"),
    researchChecks: { v1: { id: "v1", position: 1, name: "Venue", hidden: false, currentResearchPoints: 0, maximumResearchPoints: 3,
      skillChecks: { g1: { id: "g1", hidden: false, description: "1 hour", skills: skills(() => ({ dc: 18, basic: false })) } } } } },
  infiltration: { ...base("bench-infiltration", "Bench Infiltration"),
    objectives: { o1: { id: "o1", position: 1, hidden: false, name: "Objective",
      obstacles: { b1: { id: "b1", position: 1, hidden: false, name: "Obstacle", infiltrationPoints: { current: 0, max: 2 },
        skillChecks: { c1: { id: "c1", hidden: false, description: "", difficulty: { leveledDC: false, DC: 18 }, skills: skills(leveled) } } } } } },
    complications: { k1: { id: "k1", position: 1, hidden: false, name: "Complication", infiltrationPoints: { current: 0, max: 2 },
      skillChecks: { c1: { id: "c1", hidden: false, description: "", difficulty: { leveledDC: false, DC: 18 }, skills: skills(leveled) } } } } },
  influence: { ...base("bench-influence", "Bench Influence"),
    discoveries: Object.fromEntries(CHECKS.map((check, i) => [`d${i + 1}`, { id: `d${i + 1}`, position: i + 1, hidden: false,
      skill: check.skill, lore: check.lore, dc: 18, label: "" }])),
    influenceSkills: Object.fromEntries(CHECKS.map((check, i) => [`k${i + 1}`, { id: `k${i + 1}`, position: i + 1, hidden: false,
      name: `Skill ${i + 1}`, skill: check.skill, lore: check.lore, dc: 18, label: "" }])) },
};

// Expected button labels: the system's own for a skill and an unknown lore, ours for a system lore
const loreWord = game.i18n.localize("PF2E.SkillLore");
const libraryLabel = lib.systemLores().get("library-lore");
const expectedLibrary = libraryLabel.includes(loreWord) ? libraryLabel : `${loreWord}: ${libraryLabel}`;
if (lib.loreCheckLabel("library-lore") !== expectedLibrary) fail(`loreCheckLabel(library-lore): ${lib.loreCheckLabel("library-lore")}`);
if (lib.loreCheckLabel("ghost-lore") !== null) fail(`loreCheckLabel(ghost-lore): ${lib.loreCheckLabel("ghost-lore")}`);
const willLabel = game.i18n.localize(CONFIG.PF2E.saves.will);

const saved = {};
for (const tab of Object.keys(events)) saved[tab] = game.settings.get(MODULE_ID, tab).toObject();
const report = {};
// The view class is not exported: open one view and take its constructor
await lib.openSubsystemView("research");
let opened;
for (let i = 0; i < 100 && !opened; i++) {
  opened = [...foundry.applications.instances.values()].find((app) => app.constructor.name === "SystemView" && app.rendered);
  if (!opened) await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!opened) throw new Error("the subsystem view did not open within 10 s");
const View = opened.constructor;
await opened.close();

try {
  for (const [tab, event] of Object.entries(events)) {
    const data = foundry.utils.deepClone(saved[tab]);
    data.events[event.id] = event;
    await game.settings.set(MODULE_ID, tab, data);

    for (const editMode of [false, true]) {
      const view = new View(tab, event.id);
      view.editMode = editMode;
      // As navigating to an infiltration does: the first objective is shown
      if (tab === "infiltration") view.selected.infiltration.currentObjective = "o1";
      const where = `${tab} (${editMode ? "edit" : "play"})`;
      try {
        await view.render({ force: true });
        const root = view.element;
        if (/>\s*(Research Points|Max Attempts:|Add additional awareness breakpoint)\s*</.test(root.innerHTML)) fail(`${where}: unkeyed template string`);
        if (/title:[^|\]]*undefined|undefined\)/.test(root.innerHTML)) fail(`${where}: "undefined" in a roll button`);
        if (editMode) {
          const options = root.querySelectorAll("datalist#pf2e-subsystems-lores option").length;
          const loreInputs = [...root.querySelectorAll('input[type="text"][list="pf2e-subsystems-lores"]')];
          const willOptions = root.querySelectorAll('select option[value="will"]').length;
          if (!options) fail(`${where}: no lore suggestions`);
          if (!loreInputs.length) fail(`${where}: no lore input with suggestions`);
          if (!willOptions) fail(`${where}: Will not among the options`);
          report[where] = `lore suggestions ${options}, lore inputs ${loreInputs.length}, selects offering Will ${willOptions}`;
        } else {
          const buttons = [...root.querySelectorAll("a.inline-check, [data-pf2-check]")];
          const labels = [...new Set(buttons.map((b) => b.querySelector(".label")?.textContent.trim() ?? b.textContent.trim()))];
          for (const label of [expectedLibrary, willLabel]) {
            // the DC stands before or after the label, depending on the language
            if (!labels.some((text) => text.replace(/\s*\S+ \d+\s*/, " ").trim() === label)) fail(`${where}: no button "${label}" (${labels.join(" | ")})`);
          }
          const types = new Set(buttons.map((b) => b.dataset.pf2Check));
          for (const check of CHECKS) if (!types.has(check.skill)) fail(`${where}: no roll for ${check.skill} (${[...types].join(", ")})`);
          report[where] = labels.join(" | ");
        }
      } catch (error) {
        fail(`${where}: render — ${error.message}`);
      } finally {
        await view.close();
      }
    }
  }
} finally {
  for (const [tab, data] of Object.entries(saved)) await game.settings.set(MODULE_ID, tab, data);
}

if (problems.length) throw new Error(`${problems.length} problems:\n${problems.join("\n")}\n${JSON.stringify(report, null, 1)}`);
return { version: game.modules.get(MODULE_ID).version, systemLores: lib.systemLores().size, report };
