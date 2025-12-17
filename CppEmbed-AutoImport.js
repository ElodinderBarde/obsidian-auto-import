// 🧩 QuickAdd Script: CppEmbed-Flow
// Ablauf:
// 1) "# Erarbeitete Lösung"
// 2) Source: Main.cpp
// 3) Include (ohne ProjectName)
// 4) Source (ohne ProjectName & ohne Main.cpp)
// Kompatibel mit "Embed Code File" (```embed-cpp)

const fs = require("fs");
const path = require("path");

// -------------------- Konfiguration --------------------
const ROOT_DIR_NAME = "Quellcode";        // Ordner mit Include/Source
const INCLUDE_NAME  = "Include" ;          // Name des Include-Ordners (case-insensitiv)
const SOURCE_NAME   = "Source";           // Name des Source-Ordners (case-insensitiv)
const TEST_NAME     = "Test"; 
const X64_Name      = "x64"; 
const RESSOURCES_NAME = "res"; 
const MAX_HEADING_LEVEL = 7;              // maximale Heading-Tiefe (### ... ######)
// ------------------------------------------------------

module.exports = async (params) => {
  const app = params.app;
  const editor = app.workspace.activeEditor?.editor;
  if (!editor) return;

  const activeFile = app.workspace.getActiveFile();
  if (!activeFile) {
    new Notice("Keine aktive Datei.");
    return;
  }

  const vaultRoot = app.vault.adapter.basePath.replace(/\\/g, "/");
  const currentDir = path.dirname(`${vaultRoot}/${activeFile.path}`).replace(/\\/g, "/");

  // Hilfsfunktionen
  const exists = p => { try { return fs.existsSync(p); } catch { return false; } };
  const listDir = p => fs.readdirSync(p, { withFileTypes: true });
  const isCodeFile = n => /\.(cpp|cc|cxx|c|h|hpp|rc|bmp|ico|rc2|exe|obj|pch|idb|pdb|res|log|tlog|lastbuildstate|sln|vcxproj)$/i.test(n);
  const toPosix = p => p.replace(/\\/g, "/");

  const findCaseInsensitive = (base, name) => {
    if (!exists(base)) return null;
    const hit = listDir(base).find(d => d.isDirectory() && d.name.toLowerCase() === name.toLowerCase());
    return hit ? toPosix(path.join(base, hit.name)) : null;
  };

  // finde Quellcode-Root relativ zur aktiven Datei
  const qcRoot = [ROOT_DIR_NAME, ROOT_DIR_NAME.toLowerCase(), ROOT_DIR_NAME.toUpperCase()]
    .map(n => toPosix(path.join(currentDir, n)))
    .find(exists);

  if (!qcRoot) { new Notice(`Ordner '${ROOT_DIR_NAME}' nicht gefunden.`); return; }

  const includeRoot = findCaseInsensitive(qcRoot, INCLUDE_NAME);
  const sourceRoot  = findCaseInsensitive(qcRoot, SOURCE_NAME);
  const testRoot    = findCaseInsensitive(qcRoot, TEST_NAME);	
  const ressourceRoot = findCaseInsensitive(qcRoot, RESSOURCES_NAME); 
  const x64Root = findCaseInsensitive(qcRoot, X64_Name); 

  // Projektname = erster Unterordner in Include bzw. Source (symmetrisch ermitteln)
  const detectProjectName = root => {
    if (!root || !exists(root)) return null;
    const first = listDir(root).find(d => d.isDirectory()); // erster Ordner
    return first ? first.name : null;
  };
  const includeProject = detectProjectName(includeRoot);
  const sourceProject  = detectProjectName(sourceRoot);
  const testProject    = detectProjectName(testRoot); 
  const ressourceProject= detectProjectName(ressourceRoot); 
  const x64Project = detectProjectName(x64Root); 
  
  // Falls Source keinen hat, aber Include schon → gleichen Namen annehmen
  const projectName = sourceProject || includeProject || testProject || ressourceProject || x64Project || null;

  // rekursiv alle Code-Dateien sammeln
  const collectFiles = (root) => {
    if (!root || !exists(root)) return [];
    const out = [];
    const walk = (dir) => {
      for (const de of listDir(dir)) {
        const abs = toPosix(path.join(dir, de.name));
        if (de.isDirectory()) walk(abs);
        else if (isCodeFile(de.name)) out.push(abs);
      }
    };
    walk(root);
    // alphabetisch
    out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return out;
  };

  const srcFiles = collectFiles(sourceRoot);
  const incFiles = collectFiles(includeRoot);
  const testFiles = collectFiles(testRoot); 
  const x64Files = collectFiles(x64Root); 
  const resFiles = collectFiles(ressourceRoot); 
  const qcFiles  = collectFiles(qcRoot); // Neu: alle Dateien unter Quellcode sammeln

  // Utility: relative Pfade vorbereiten
  const toVaultRel = abs => toPosix(path.relative(vaultRoot, abs));

  // Hilfsfunktion: prüfen ob child unter parent liegt
  const isUnder = (parent, child) => {
    if (!parent || !child) return false;
    try {
      const rel = toPosix(path.relative(parent, child));
      if (!rel) return false; // gleiche Pfade: nicht relevant für Dateien
      return !rel.startsWith("..");
    } catch {
      return false;
    }
  };

  // Dateien die direkt im Quellcode-Root liegen, aber NICHT in einem der speziellen Unterordner
  const specialRoots = [includeRoot, sourceRoot, testRoot, ressourceRoot, x64Root].filter(Boolean);
  const qcFilesFiltered = qcFiles.filter(f => !specialRoots.some(r => isUnder(r, f)));

  // ------------- 1) Header -------------
  let out = "# Erarbeitete Lösung\n\n";

  // ------------- 2) Source → Main.cpp -------------
  // Suche Main.cpp sowohl in Source als auch in Quellcode-Root (falls MFC dort die Datei ablegt)
  const searchForMain = [...srcFiles, ...qcFilesFiltered];
  const mainAbs = searchForMain.find(f => path.basename(f).toLowerCase() === "main.cpp");
  if (mainAbs) {
    const mainRelVault = toVaultRel(mainAbs);
    out += "## Main.cpp\n";
    out += `[[${mainRelVault}|Main]]\n`;
    out += "```embed-cpp\n";
    out += `PATH: "vault://${mainRelVault}"\n`;
    out += `TITLE: "Main.cpp"\n`;
    out += "```\n\n";
  }

  // Helper: Baum als Überschriften + Embeds ausgeben
  // Jetzt: explizites root übergeben, robustere Prüfung auf "unterhalb von root"
  const buildTree = (sectionTitle, files, root, skipFirstFolderName, excludeNamesSet) => {
    if (!files.length) return "";
    if (!root || !exists(root)) return "";

    let s = `\n## ${sectionTitle}\n\n`;
    const printedHeadings = new Set();

    for (const abs of files) {
      // relativ zum übergebenen root
      const relToRoot = toPosix(path.relative(root, abs));

      // Wenn Datei nicht im root liegt, überspringen
      if (!relToRoot || relToRoot === "" || relToRoot.split("/")[0] === "..") continue;

      // Teile bereinigen (keine leeren oder '.' Segmente)
      const partsOrig = relToRoot.split("/").filter(p => p && p !== ".");

      // optional ProjectName entfernen (nur wenn er wirklich erstes Segment ist)
      let parts = partsOrig.slice();
      if (skipFirstFolderName && parts.length > 1 && parts[0].toLowerCase() === skipFirstFolderName.toLowerCase()) {
        parts = parts.slice(1);
      }

      if (parts.length === 0) continue;

      const fileName = parts[parts.length - 1];
      if (excludeNamesSet && excludeNamesSet.has(fileName.toLowerCase())) continue;

      // Headings für alle Zwischenordner
      // Start-Ebene ### (=3) → Ordner = 3.., Datei = last level +1
      for (let i = 0; i < parts.length - 1; i++) {
        const key = `${sectionTitle}:${parts.slice(0, i + 1).join("/")}`;
        if (printedHeadings.has(key)) continue;
        printedHeadings.add(key);

        const level = Math.min(3 + i, MAX_HEADING_LEVEL);
        s += `${"#".repeat(level)} ${parts[i]}\n`;
      }

      // Datei-Heading
      const level = Math.min(3 + (parts.length - 1)+1, MAX_HEADING_LEVEL);
      s += `${"#".repeat(level)} ${fileName}\n`;
      s += `[[${toVaultRel(abs)}|${fileName}]]\n`;

      s += "```embed-cpp\n";
      s += `PATH: "vault://${toVaultRel(abs)}"\n`;
      s += `TITLE: "${fileName}"\n`;
      s += "```\n\n";
    }
    return s;
  };

  // Exclude-Set (Main wird bereits einzeln oben angezeigt)
  const exclude = new Set(["main.cpp"]);

  // ------------- A) Quellcode-Root (alles was direkt unter Quellcode liegt, ohne spezielle Unterordner) -------------
  out += buildTree("Quellcode", qcFilesFiltered, qcRoot, null, exclude);

  // ------------- 3) Include (ohne ProjectName) -------------
  out += buildTree("Include", incFiles, includeRoot, projectName, null);

  // ------------- 4) Source (ohne ProjectName & ohne Main.cpp) -------------
  out += buildTree("Source", srcFiles, sourceRoot, projectName, exclude);

  // ------------- 5) Ressources  -------------
  out += buildTree("Ressources", resFiles, ressourceRoot, projectName, null);

  // -------------6) Debug / Release Files -------
  out += buildTree("Release / Debug", x64Files, x64Root, projectName, null); 

  // -------------- 7) Tests -------------------
  out += buildTree("Tests", testFiles, testRoot, projectName, null); 

  // Ausgabe in den aktiven Editor einfügen
  editor.replaceSelection(out.trim());

  new Notice("✅ Fertig: Main, Quellcode, Include, Source und Tests generiert. Collapse gestartet.");
};